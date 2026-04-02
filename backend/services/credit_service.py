"""Credit management service for session billing."""
import os
import logging
import asyncio
from datetime import datetime, timezone
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Billing: 0.5 credits per 30 min of active session
CREDITS_PER_INTERVAL = 0.5
BILLING_INTERVAL_SECONDS = 30 * 60  # 30 minutes
WARN_THRESHOLD_SECONDS = 30  # warn when 30 seconds remain in interval


def _headers() -> dict:
    """Headers para requests con service role key."""
    return {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
    }


@dataclass
class CreditBalance:
    available: float
    used_this_session: float = 0.0


async def get_balance(user_id: str) -> CreditBalance:
    """Return current credit balance for a user via REST directo."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/user_credits",
                headers=_headers(),
                params={"select": "balance", "user_id": f"eq.{user_id}"},
            )
        if resp.status_code == 200:
            data = resp.json()
            balance = data[0].get("balance", 0.0) if data else 0.0
            return CreditBalance(available=float(balance))
        logger.error("get_balance HTTP %s: %s", resp.status_code, resp.text[:200])
    except Exception as exc:
        logger.error("get_balance error: %s", exc)
    return CreditBalance(available=0.0)


async def deduct_credits(user_id: str, session_id: str, amount: float = CREDITS_PER_INTERVAL) -> bool:
    """
    Deduct credits via RPC directo.
    Returns True if successful, False if insufficient credits.
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/deduct_session_credits",
                headers=_headers(),
                json={
                    "p_user_id": user_id,
                    "p_session_id": session_id,
                    "p_amount": amount,
                    "p_description": "Sesión activa — 30 min",
                },
            )
        if resp.status_code == 200:
            return bool(resp.json())
        logger.error("deduct_credits HTTP %s: %s", resp.status_code, resp.text[:200])
    except Exception as exc:
        logger.error("deduct_credits error: %s", exc)
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
