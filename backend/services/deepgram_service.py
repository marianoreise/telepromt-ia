"""Deepgram Nova-2 streaming STT service."""
import os
import logging
import asyncio
from typing import AsyncGenerator, Callable
from dataclasses import dataclass

try:
    # deepgram-sdk v3.x (pinned in requirements.txt for Railway/CI)
    from deepgram import (
        DeepgramClient,
        DeepgramClientOptions,
        LiveTranscriptionEvents,
        LiveOptions,
    )
except ImportError:
    # deepgram-sdk v6.x (may be installed locally with newer Python)
    from deepgram import DeepgramClient  # type: ignore[no-redef]
    DeepgramClientOptions = None  # type: ignore[assignment]
    LiveTranscriptionEvents = None  # type: ignore[assignment]
    LiveOptions = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)

DEEPGRAM_API_KEY = os.environ.get("DEEPGRAM_API_KEY", "")


@dataclass
class TranscriptResult:
    text: str
    is_final: bool
    confidence: float = 0.0
    speech_final: bool = False


class DeepgramStreamingSession:
    """
    Manages a single user's Deepgram live-transcription session.
    Receives raw PCM audio bytes and yields TranscriptResult objects.
    """

    def __init__(self, language: str = "es") -> None:
        self._language = language
        self._dg_connection = None
        self._queue: asyncio.Queue[TranscriptResult | None] = asyncio.Queue()
        self._connected = False

    async def start(self) -> None:
        """Open Deepgram live connection."""
        opts = DeepgramClientOptions(api_key=DEEPGRAM_API_KEY)
        client = DeepgramClient(config=opts)

        audio_config = LiveOptions(
            model="nova-2",
            language="es-419" if self._language == "es" else "en-US",
            smart_format=True,
            interim_results=True,
            utterance_end_ms="1000",
            vad_events=True,
            encoding="linear16",
            sample_rate=16000,
            channels=1,
            punctuate=True,
        )

        self._dg_connection = client.listen.asyncwebsocket.v("1")

        # Wire Deepgram events → internal queue
        self._dg_connection.on(LiveTranscriptionEvents.Transcript, self._on_transcript)
        self._dg_connection.on(LiveTranscriptionEvents.Error, self._on_error)
        self._dg_connection.on(LiveTranscriptionEvents.Close, self._on_close)

        started = await self._dg_connection.start(audio_config)
        if not started:
            raise RuntimeError("No se pudo iniciar conexión con Deepgram")

        self._connected = True
        logger.info("Deepgram session started (lang=%s)", self._language)

    async def send_audio(self, chunk: bytes) -> None:
        """Forward raw audio bytes to Deepgram."""
        if self._connected and self._dg_connection:
            await self._dg_connection.send(chunk)

    async def transcripts(self) -> AsyncGenerator[TranscriptResult, None]:
        """Async generator that yields transcript results until session ends."""
        while True:
            result = await self._queue.get()
            if result is None:
                break
            yield result

    async def stop(self) -> None:
        """Close Deepgram connection and signal end of stream."""
        self._connected = False
        if self._dg_connection:
            await self._dg_connection.finish()
        await self._queue.put(None)

    # ── Deepgram event handlers ──────────────────────────────────────────────

    async def _on_transcript(self, _client, result, **_kwargs) -> None:
        try:
            alt = result.channel.alternatives[0]
            text = alt.transcript.strip()
            if not text:
                return
            is_final = result.is_final
            confidence = getattr(alt, "confidence", 0.0)
            speech_final = getattr(result, "speech_final", False)
            await self._queue.put(
                TranscriptResult(
                    text=text,
                    is_final=is_final,
                    confidence=confidence,
                    speech_final=speech_final,
                )
            )
        except (AttributeError, IndexError) as exc:
            logger.warning("Malformed Deepgram result: %s", exc)

    async def _on_error(self, _client, error, **_kwargs) -> None:
        logger.error("Deepgram error: %s", error)
        await self._queue.put(None)

    async def _on_close(self, _client, close, **_kwargs) -> None:
        logger.info("Deepgram connection closed")
        await self._queue.put(None)
