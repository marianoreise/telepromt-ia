"""
Mercado Pago payment integration.

Flow:
  1. POST /payments/create-preference  → creates MP preference, returns init_point URL
  2. User pays on Mercado Pago
  3. MP sends IPN to POST /payments/webhook
  4. Webhook verifies signature, credits user account
"""
import hashlib
import hmac
import logging
import os
import uuid

import mercadopago
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from supabase import create_client

from middleware.auth import UserContext, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])

MP_ACCESS_TOKEN = os.environ.get("MERCADOPAGO_ACCESS_TOKEN", "")
MP_WEBHOOK_SECRET = os.environ.get("MERCADOPAGO_WEBHOOK_SECRET", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://telepromt-ia.vercel.app")


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _get_mp_sdk() -> mercadopago.SDK:
    return mercadopago.SDK(MP_ACCESS_TOKEN)


# ── Credit packages ───────────────────────────────────────────────────────────

PACKAGES = {
    "starter": {"credits": 10,  "price": 5.0,  "currency": "USD", "title": "Starter — 10 créditos"},
    "pro":     {"credits": 25,  "price": 10.0, "currency": "USD", "title": "Pro — 25 créditos"},
    "max":     {"credits": 60,  "price": 20.0, "currency": "USD", "title": "Max — 60 créditos"},
}


# ── Request / Response schemas ────────────────────────────────────────────────

class CreatePreferenceRequest(BaseModel):
    package_id: str  # "starter" | "pro" | "max"


class CreatePreferenceResponse(BaseModel):
    preference_id: str
    init_point: str       # full checkout URL (production)
    sandbox_init_point: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/create-preference", response_model=CreatePreferenceResponse)
async def create_preference(
    body: CreatePreferenceRequest,
    user: UserContext = Depends(get_current_user),
) -> CreatePreferenceResponse:
    """Create a Mercado Pago preference for the selected credit package."""
    package = PACKAGES.get(body.package_id)
    if not package:
        raise HTTPException(status_code=400, detail=f"Paquete inválido: {body.package_id}")

    external_reference = f"{user.id}|{body.package_id}|{uuid.uuid4()}"

    sdk = _get_mp_sdk()
    preference_data = {
        "items": [
            {
                "id": body.package_id,
                "title": package["title"],
                "quantity": 1,
                "unit_price": package["price"],
                "currency_id": package["currency"],
            }
        ],
        "payer": {"email": user.email},
        "back_urls": {
            "success": f"{FRONTEND_URL}/dashboard/billing?status=success",
            "failure": f"{FRONTEND_URL}/dashboard/billing?status=failure",
            "pending": f"{FRONTEND_URL}/dashboard/billing?status=pending",
        },
        "auto_return": "approved",
        "external_reference": external_reference,
        "notification_url": f"{os.environ.get('BACKEND_URL', 'https://backend-production-c314.up.railway.app')}/payments/webhook",
        "statement_descriptor": "TELEPROMT IA",
    }

    result = sdk.preference().create(preference_data)
    if result["status"] not in (200, 201):
        logger.error("MP preference creation failed: %s", result)
        raise HTTPException(status_code=502, detail="Error al crear preferencia de pago")

    response = result["response"]
    logger.info(
        "MP preference created: %s | user=%s | package=%s",
        response["id"], user.id, body.package_id,
    )

    return CreatePreferenceResponse(
        preference_id=response["id"],
        init_point=response["init_point"],
        sandbox_init_point=response["sandbox_init_point"],
    )


@router.post("/webhook")
async def payment_webhook(request: Request) -> dict:
    """
    Mercado Pago IPN webhook.
    Verifies signature and credits the user on approved payment.
    """
    body_bytes = await request.body()

    # Verify MP signature if secret is configured
    if MP_WEBHOOK_SECRET and MP_WEBHOOK_SECRET != "PENDIENTE":
        mp_signature = request.headers.get("x-signature", "")
        mp_request_id = request.headers.get("x-request-id", "")
        data_id = request.query_params.get("data.id", "")

        manifest = f"id:{data_id};request-id:{mp_request_id};ts:{_extract_ts(mp_signature)};"
        expected = hmac.new(
            MP_WEBHOOK_SECRET.encode(),
            manifest.encode(),
            hashlib.sha256,
        ).hexdigest()

        received = _extract_v1(mp_signature)
        if not hmac.compare_digest(expected, received):
            logger.warning("MP webhook signature mismatch")
            raise HTTPException(status_code=401, detail="Firma inválida")

    # Parse notification
    try:
        payload = await request.json()
    except Exception:
        return {"status": "ignored"}

    notification_type = payload.get("type") or payload.get("action", "")
    resource_id = (payload.get("data") or {}).get("id") or payload.get("id")

    if notification_type not in ("payment", "payment.created", "payment.updated"):
        return {"status": "ignored", "type": notification_type}

    if not resource_id:
        return {"status": "ignored"}

    # Fetch payment details from MP
    sdk = _get_mp_sdk()
    payment_result = sdk.payment().get(resource_id)
    if payment_result["status"] != 200:
        logger.error("Failed to fetch MP payment %s", resource_id)
        return {"status": "error"}

    payment = payment_result["response"]
    status = payment.get("status")
    external_reference = payment.get("external_reference", "")

    logger.info("MP payment %s: status=%s ref=%s", resource_id, status, external_reference)

    if status != "approved":
        return {"status": "not_approved", "payment_status": status}

    # Parse external_reference: "user_id|package_id|nonce"
    parts = external_reference.split("|")
    if len(parts) < 2:
        logger.error("Invalid external_reference: %s", external_reference)
        return {"status": "error"}

    user_id, package_id = parts[0], parts[1]
    package = PACKAGES.get(package_id)
    if not package:
        logger.error("Unknown package_id in reference: %s", package_id)
        return {"status": "error"}

    # Idempotency: check if this payment was already processed
    db = _get_supabase()
    existing = (
        db.from_("credit_transactions")
        .select("id")
        .eq("mp_payment_id", str(resource_id))
        .execute()
    )
    if existing.data:
        logger.info("Payment %s already processed, skipping", resource_id)
        return {"status": "already_processed"}

    # Credit the user
    credits = package["credits"]
    db.from_("credit_transactions").insert({
        "user_id": user_id,
        "amount": float(credits),
        "type": "purchase",
        "description": f"Compra {package['title']} — MP #{resource_id}",
        "mp_payment_id": str(resource_id),
    }).execute()

    logger.info(
        "Credited %d credits to user %s (MP payment %s)",
        credits, user_id, resource_id,
    )
    return {"status": "ok", "credits_added": credits}


@router.get("/packages")
async def list_packages() -> list[dict]:
    """Return available credit packages."""
    return [
        {"id": k, **v} for k, v in PACKAGES.items()
    ]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_ts(signature: str) -> str:
    """Extract ts value from MP x-signature header."""
    for part in signature.split(","):
        if part.strip().startswith("ts="):
            return part.strip()[3:]
    return ""


def _extract_v1(signature: str) -> str:
    """Extract v1 hash from MP x-signature header."""
    for part in signature.split(","):
        if part.strip().startswith("v1="):
            return part.strip()[3:]
    return ""
