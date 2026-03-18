"""Credit management service for session billing."""
import os
import logging
import asyncio
from datetime import datetime, timezone
from dataclasses import dataclass, field

from supabase import create_client, Client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Billing: 0.5 credits per 30 min of active session
CREDITS_PER_INTERVAL = 0.5
BILLING_INTERVAL_SECONDS = 30 * 60  # 30 minutes
WARN_THRESHOLD_SECONDS = 30  # warn when 30 seconds remain in interval

_supabase_client: Client | None = None


def _get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client


@dataclass
class CreditBalance:
    available: float
    used_this_session: float = 0.0


async def get_balance(user_id: str) -> CreditBalance:
    """Return current credit balance for a user."""
    db = _get_supabase()
    result = db.from_("user_credits").select("balance").eq("user_id", user_id).single().execute()
    balance = result.data.get("balance", 0.0) if result.data else 0.0
    return CreditBalance(available=float(balance))


async def deduct_credits(user_id: str, session_id: str, amount: float = CREDITS_PER_INTERVAL) -> bool:
    """
    Deduct credits for a billing interval.
    Returns True if successful, False if insufficient credits.
    """
    db = _get_supabase()
    try:
        # Atomic deduction via RPC (defined in migration)
        result = db.rpc(
            "deduct_session_credits",
            {
                "p_user_id": user_id,
                "p_session_id": session_id,
                "p_amount": amount,
                "p_description": f"Sesión activa — 30 min",
            },
        ).execute()
        success = result.data if result.data is not None else False
        if not success:
            logger.info("Insufficient credits for user %s", user_id)
        return bool(success)
    except Exception as exc:
        logger.error("Credit deduction error for %s: %s", user_id, exc)
        return False


@dataclass
class SessionBillingTracker:
    """
    Tracks billing intervals for an active session.
    Emits 'warn' events when approaching interval end, 'charge' when interval completes.
    """
    user_id: str
    session_id: str
    _start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    _last_charge_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    _task: asyncio.Task | None = field(default=None, repr=False)
    _on_warn: asyncio.Queue = field(default_factory=asyncio.Queue, repr=False)
    _on_out_of_credits: asyncio.Queue = field(default_factory=asyncio.Queue, repr=False)

    def start(self) -> None:
        self._task = asyncio.create_task(self._billing_loop())

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _billing_loop(self) -> None:
        """Loop that charges credits every BILLING_INTERVAL_SECONDS."""
        try:
            while True:
                # Sleep until warning threshold
                await asyncio.sleep(BILLING_INTERVAL_SECONDS - WARN_THRESHOLD_SECONDS)
                await self._on_warn.put({"seconds_remaining": WARN_THRESHOLD_SECONDS})

                # Sleep remaining time then charge
                await asyncio.sleep(WARN_THRESHOLD_SECONDS)
                success = await deduct_credits(self.user_id, self.session_id)
                self._last_charge_time = datetime.now(timezone.utc)

                if not success:
                    await self._on_out_of_credits.put(True)
                    break
        except asyncio.CancelledError:
            pass

    async def next_warn_event(self) -> dict | None:
        """Returns the next warning event or None if queue is empty."""
        try:
            return self._on_warn.get_nowait()
        except asyncio.QueueEmpty:
            return None

    async def is_out_of_credits(self) -> bool:
        """Check if an out-of-credits event has been emitted."""
        try:
            self._on_out_of_credits.get_nowait()
            return True
        except asyncio.QueueEmpty:
            return False
