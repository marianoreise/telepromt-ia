"""
WebSocket endpoint for real-time STT + AI response.

Protocol (client → server):
  - First message: JSON {"token": "<supabase_jwt>", "language": "es"|"en"}
  - Subsequent messages: raw PCM audio bytes (16-bit, 16kHz, mono)
  - Text message "stop": graceful disconnect

Protocol (server → client):
  {"type": "connected", "session_id": "...", "balance": 2.0}
  {"type": "transcript", "text": "...", "is_final": true|false}
  {"type": "ai_start"}
  {"type": "ai_chunk", "chunk": "..."}
  {"type": "ai_done"}
  {"type": "warn", "seconds_remaining": 30}
  {"type": "out_of_credits"}
  {"type": "error", "message": "..."}
"""
import asyncio
import json
import logging
import os
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from supabase import create_client

from services.deepgram_service import DeepgramStreamingSession
from services.ai_service import stream_ai_response, is_question
from services.credit_service import SessionBillingTracker, get_balance
from services.auth_utils import verify_supabase_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["stt"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

FREE_SESSION_SECONDS = 600  # 10 minutes for zero-balance users
FREE_WARN_SECONDS = 30       # warn 30 seconds before expiry


def _verify_token(token: str) -> tuple[str, str]:
    """Returns (user_id, email). Raises ValueError on invalid token."""
    return verify_supabase_token(token)


async def _get_user_language(user_id: str) -> str:
    """Fetch user preferred language from DB."""
    try:
        db = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        result = (
            db.from_("user_profiles")
            .select("preferred_language")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data.get("preferred_language", "es") if result.data else "es"
    except Exception:
        return "es"


@router.websocket("/stt")
async def stt_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    session_id = str(uuid.uuid4())
    dg_session: DeepgramStreamingSession | None = None
    billing: SessionBillingTracker | None = None
    free_limit_task: asyncio.Task | None = None
    user_id: str | None = None

    try:
        # ── 1. Auth handshake ────────────────────────────────────────────────
        raw = await asyncio.wait_for(ws.receive_text(), timeout=10.0)
        handshake = json.loads(raw)
        token = handshake.get("token", "")
        forced_lang = handshake.get("language")

        try:
            # Validar token via HTTP directo a Supabase (evita PyJWT que no soporta ES256)
            import httpx as _httpx
            resp = _httpx.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_SERVICE_KEY,
                },
                timeout=10,
            )
            if resp.status_code != 200:
                raise ValueError(f"Token inválido (HTTP {resp.status_code})")
            user_data = resp.json()
            user_id = str(user_data["id"])
            _email = user_data.get("email", "")
            logger.info("WebSocket auth OK: user=%s", user_id)
        except ValueError as exc:
            logger.error("Token verification failed: %s", exc)
            await ws.send_json({"type": "error", "message": str(exc)})
            await ws.close(code=4001)
            return
        except Exception as exc:
            logger.error("Token verification exception: %s", exc)
            await ws.send_json({"type": "error", "message": "Token inválido"})
            await ws.close(code=4001)
            return

        language = forced_lang or await _get_user_language(user_id)
        balance = await get_balance(user_id)

        await ws.send_json({
            "type": "connected",
            "session_id": session_id,
            "balance": balance.available,
        })

        # ── 2. Start Deepgram session ────────────────────────────────────────
        dg_session = DeepgramStreamingSession(language=language)
        await dg_session.start()

        # ── 3. Start billing tracker ─────────────────────────────────────────
        billing = SessionBillingTracker(user_id=user_id, session_id=session_id)
        billing.start()

        # ── 3b. Free-tier hard limit: enforce 10 min if balance == 0 ─────────
        if balance.available == 0:
            async def _free_session_watchdog() -> None:
                await asyncio.sleep(FREE_SESSION_SECONDS - FREE_WARN_SECONDS)
                try:
                    await ws.send_json({"type": "warn", "seconds_remaining": FREE_WARN_SECONDS})
                    await asyncio.sleep(FREE_WARN_SECONDS)
                    await ws.send_json({"type": "out_of_credits"})
                    await ws.close(code=1000)
                except Exception:
                    pass

            free_limit_task = asyncio.create_task(_free_session_watchdog())

        # ── 4. Background task: pipe Deepgram transcripts → WS + trigger AI ─
        last_transcript: list[str] = ['']  # mutable container para compartir entre tareas

        async def process_transcripts() -> None:
            async for result in dg_session.transcripts():
                await ws.send_json({
                    "type": "transcript",
                    "text": result.text,
                    "is_final": result.is_final,
                })

                # Guardar el último transcript final para request_ai manual
                if result.is_final and result.text.strip():
                    last_transcript[0] = result.text

                # Trigger AI automático en speech_final con pregunta detectada
                if result.speech_final and is_question(result.text):
                    asyncio.create_task(
                        _stream_ai_to_ws(ws, user_id, result.text, language)
                    )

        transcript_task = asyncio.create_task(process_transcripts())

        # ── 5. Main loop: receive audio bytes ────────────────────────────────
        while True:
            # Check billing events
            warn = await billing.next_warn_event()
            if warn:
                await ws.send_json({"type": "warn", "seconds_remaining": warn["seconds_remaining"]})

            out_of_credits = await billing.is_out_of_credits()
            if out_of_credits:
                await ws.send_json({"type": "out_of_credits"})
                break

            try:
                msg = await asyncio.wait_for(ws.receive(), timeout=0.1)
            except asyncio.TimeoutError:
                continue

            if "bytes" in msg and msg["bytes"]:
                await dg_session.send_audio(msg["bytes"])
            elif "text" in msg:
                text = msg["text"]
                if text == "stop":
                    break
                # Mensajes JSON del frontend
                try:
                    data = json.loads(text)
                    if data.get("type") == "request_ai":
                        question = last_transcript[0].strip()
                        if question:
                            asyncio.create_task(
                                _stream_ai_to_ws(ws, user_id, question, language)
                            )
                        else:
                            await ws.send_json({"type": "warn", "message": "Sin transcripción disponible"})
                except (json.JSONDecodeError, KeyError):
                    pass

    except WebSocketDisconnect:
        logger.info("Session %s: client disconnected", session_id)
    except Exception as exc:
        logger.error("Session %s error: %s", session_id, exc)
        try:
            await ws.send_json({"type": "error", "message": "Error interno del servidor"})
        except Exception:
            pass
    finally:
        if dg_session:
            await dg_session.stop()
        if billing:
            await billing.stop()
        if free_limit_task and not free_limit_task.done():
            free_limit_task.cancel()
        try:
            transcript_task.cancel()
        except Exception:
            pass
        logger.info("Session %s closed (user=%s)", session_id, user_id)


async def _stream_ai_to_ws(
    ws: WebSocket,
    user_id: str,
    question: str,
    language: str,
) -> None:
    """Stream AI response chunks to WebSocket client."""
    try:
        await ws.send_json({"type": "ai_start"})
        async for chunk in stream_ai_response(user_id, question, language):
            await ws.send_json({"type": "ai_chunk", "chunk": chunk})
        await ws.send_json({"type": "ai_done"})
    except Exception as exc:
        logger.error("AI streaming error: %s", exc)
        try:
            await ws.send_json({"type": "error", "message": "Error al generar respuesta IA"})
        except Exception:
            pass
