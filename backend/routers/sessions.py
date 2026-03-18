"""Session history and credit balance endpoints."""
import os
import logging
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from supabase import create_client

from middleware.auth import UserContext, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sessions", tags=["sessions"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


class BalanceResponse(BaseModel):
    balance: float
    used_all_time: float


class SessionSummary(BaseModel):
    id: str
    started_at: str
    ended_at: str | None
    duration_sec: int | None
    credits_used: float


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

    # Total used = sum of negative transactions
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
    limit: int = 20,
) -> list[SessionSummary]:
    """List recent sessions for the current user."""
    db = _get_supabase()
    result = (
        db.from_("sessions")
        .select("id, started_at, ended_at, duration_sec, credits_used")
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
        )
        for row in (result.data or [])
    ]
