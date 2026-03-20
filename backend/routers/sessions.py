"""Session endpoints: history, balance, create, detail, end."""
import os
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from supabase import create_client

from middleware.auth import UserContext, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions", tags=["sessions"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
FREE_SESSION_SECONDS: int = 600  # 10 minutos


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ── Modelos ────────────────────────────────────────────────────────────────


class BalanceResponse(BaseModel):
    balance: float
    used_all_time: float


class SessionSummary(BaseModel):
    id: str
    started_at: str
    ended_at: str | None
    duration_sec: int | None
    credits_used: float
    company: str
    job_title: str
    status: str


class SessionDetail(BaseModel):
    id: str
    started_at: str
    ended_at: str | None
    duration_sec: int | None
    credits_used: float
    company: str
    job_title: str
    status: str
    seconds_remaining: int | None


class SessionCreateRequest(BaseModel):
    company: str = Field(..., min_length=1, max_length=200)
    job_title: str = Field(..., min_length=1, max_length=200)


class SessionEndResponse(BaseModel):
    id: str
    status: str
    duration_sec: int
    credits_used: float


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.get("/me")
async def get_me(user: UserContext = Depends(get_current_user)) -> dict:
    """Devuelve id, email y créditos del usuario autenticado. Usado por la app desktop."""
    db = _get_supabase()
    result = (
        db.from_("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    balance = float(result.data["balance"]) if result.data else 0.0
    return {"id": user.id, "email": user.email, "credits": balance}


@router.get("/balance", response_model=BalanceResponse)
async def get_balance(user: UserContext = Depends(get_current_user)) -> BalanceResponse:
    """Return current credit balance."""
    db = _get_supabase()
    result = (
        db.from_("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single()
        .execute()
    )
    balance = float(result.data.get("balance", 0.0)) if result.data else 0.0

    tx_result = (
        db.from_("credit_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .eq("type", "usage")
        .execute()
    )
    used = sum(abs(float(row["amount"])) for row in (tx_result.data or []))

    return BalanceResponse(balance=balance, used_all_time=used)


@router.get("/", response_model=list[SessionSummary])
async def list_sessions(
    user: UserContext = Depends(get_current_user),
    limit: int = 5,
) -> list[SessionSummary]:
    """List recent sessions for the current user (last 5)."""
    db = _get_supabase()
    result = (
        db.from_("sessions")
        .select("id, started_at, ended_at, duration_sec, credits_used, company, job_title, status")
        .eq("user_id", user.id)
        .order("started_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [
        SessionSummary(
            id=row["id"],
            started_at=row["started_at"],
            ended_at=row.get("ended_at"),
            duration_sec=row.get("duration_sec"),
            credits_used=float(row.get("credits_used", 0)),
            company=row.get("company", ""),
            job_title=row.get("job_title", ""),
            status=row.get("status", "ended"),
        )
        for row in (result.data or [])
    ]


# ── Nuevos endpoints F05 ───────────────────────────────────────────────────


@router.post("/", response_model=SessionDetail, status_code=201)
async def create_session(
    body: SessionCreateRequest,
    user: UserContext = Depends(get_current_user),
) -> SessionDetail:
    """Create a new free 10-minute session."""
    db = _get_supabase()

    # Verificar sesión activa existente
    existing = (
        db.from_("sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Ya existe una sesión activa",
                "active_session_id": str(existing.data[0]["id"]),
            },
        )

    # Insertar nueva sesión
    insert_result = (
        db.from_("sessions")
        .insert(
            {
                "user_id": user.id,
                "company": body.company,
                "job_title": body.job_title,
                "status": "active",
                "credits_used": 0,
            }
        )
        .execute()
    )

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Error al crear la sesión")

    row = insert_result.data[0]
    return SessionDetail(
        id=str(row["id"]),
        started_at=row["started_at"],
        ended_at=None,
        duration_sec=None,
        credits_used=0.0,
        company=row["company"],
        job_title=row["job_title"],
        status="active",
        seconds_remaining=FREE_SESSION_SECONDS,
    )


@router.get("/{session_id}", response_model=SessionDetail)
async def get_session(
    session_id: str,
    user: UserContext = Depends(get_current_user),
) -> SessionDetail:
    """Get session detail with lazy expiration."""
    db = _get_supabase()

    result = (
        db.from_("sessions")
        .select("id, started_at, ended_at, duration_sec, credits_used, company, job_title, status")
        .eq("id", session_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    row = result.data
    seconds_remaining: int | None = None

    if row["status"] == "active":
        started_at = datetime.fromisoformat(row["started_at"])
        now_utc = datetime.now(timezone.utc)
        seconds_elapsed = int((now_utc - started_at).total_seconds())
        seconds_remaining = max(0, FREE_SESSION_SECONDS - seconds_elapsed)

        # Expiración lazy
        if seconds_remaining == 0:
            duration_sec = min(seconds_elapsed, FREE_SESSION_SECONDS)
            db.from_("sessions").update(
                {
                    "status": "expired",
                    "ended_at": now_utc.isoformat(),
                    "duration_sec": duration_sec,
                }
            ).eq("id", session_id).execute()
            return SessionDetail(
                id=str(row["id"]),
                started_at=row["started_at"],
                ended_at=now_utc.isoformat(),
                duration_sec=duration_sec,
                credits_used=float(row.get("credits_used", 0)),
                company=row["company"],
                job_title=row["job_title"],
                status="expired",
                seconds_remaining=None,
            )

    return SessionDetail(
        id=str(row["id"]),
        started_at=row["started_at"],
        ended_at=row.get("ended_at"),
        duration_sec=row.get("duration_sec"),
        credits_used=float(row.get("credits_used", 0)),
        company=row["company"],
        job_title=row["job_title"],
        status=row["status"],
        seconds_remaining=seconds_remaining,
    )


@router.post("/{session_id}/end", response_model=SessionEndResponse)
async def end_session(
    session_id: str,
    user: UserContext = Depends(get_current_user),
) -> SessionEndResponse:
    """Manually end an active session."""
    db = _get_supabase()

    result = (
        db.from_("sessions")
        .select("id, started_at, status")
        .eq("id", session_id)
        .eq("user_id", user.id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")

    row = result.data
    if row["status"] != "active":
        raise HTTPException(status_code=409, detail="La sesión ya fue cerrada")

    started_at = datetime.fromisoformat(row["started_at"])
    now_utc = datetime.now(timezone.utc)
    seconds_elapsed = int((now_utc - started_at).total_seconds())
    duration_sec = min(seconds_elapsed, FREE_SESSION_SECONDS)

    db.from_("sessions").update(
        {
            "status": "ended",
            "ended_at": now_utc.isoformat(),
            "duration_sec": duration_sec,
            "credits_used": 0,
        }
    ).eq("id", session_id).execute()

    return SessionEndResponse(
        id=str(row["id"]),
        status="ended",
        duration_sec=duration_sec,
        credits_used=0.0,
    )
