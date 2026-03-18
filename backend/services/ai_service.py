"""AI response generation with Claude + optional RAG context."""
import os
import logging
from typing import AsyncGenerator

import anthropic
from openai import AsyncOpenAI
from supabase import create_client, Client

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

CLAUDE_MODEL = "claude-sonnet-4-5"
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMS = 1536
TOP_K = 4
MAX_CONTEXT_CHARS = 3000

SYSTEM_PROMPT = """Eres un asistente experto en entrevistas y videollamadas profesionales.
Tu rol es ayudar al usuario respondiendo preguntas en tiempo real, de forma concisa y directa.

Reglas:
- Respuestas breves (máximo 3-4 oraciones a menos que se pida más)
- Usa el contexto del CV/conocimiento del usuario si está disponible
- Si no sabés la respuesta, decilo honestamente
- Idioma: responde en el mismo idioma que la pregunta
- No uses markdown en tu respuesta (se mostrará en pantalla como texto plano)
- Empieza directo con la respuesta, sin preámbulos"""

_anthropic_client: anthropic.AsyncAnthropic | None = None
_openai_client: AsyncOpenAI | None = None
_supabase_client: Client | None = None


def _get_anthropic() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    return _anthropic_client


def _get_openai() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    return _openai_client


def _get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _supabase_client


async def _embed_text(text: str) -> list[float]:
    """Generate embedding vector for a text chunk."""
    resp = await _get_openai().embeddings.create(
        model=EMBED_MODEL,
        input=text[:8000],  # token limit safety
        dimensions=EMBED_DIMS,
    )
    return resp.data[0].embedding


async def _retrieve_context(user_id: str, query: str) -> str:
    """Retrieve relevant knowledge from Supabase pgvector store."""
    try:
        query_vec = await _embed_text(query)
        db = _get_supabase()
        result = db.rpc(
            "match_knowledge",
            {
                "query_embedding": query_vec,
                "match_user_id": user_id,
                "match_count": TOP_K,
                "similarity_threshold": 0.65,
            },
        ).execute()

        if not result.data:
            return ""

        chunks = [row["content"] for row in result.data]
        context = "\n\n".join(chunks)[:MAX_CONTEXT_CHARS]
        return context
    except Exception as exc:
        logger.warning("RAG retrieval failed: %s", exc)
        return ""


async def stream_ai_response(
    user_id: str,
    question: str,
    language: str = "es",
) -> AsyncGenerator[str, None]:
    """
    Stream Claude response for a given question.
    Retrieves RAG context from user's knowledge base first.
    Yields text chunks as they arrive.
    """
    context = await _retrieve_context(user_id, question)

    user_message = question
    if context:
        user_message = (
            f"Contexto relevante de mi CV/conocimiento:\n{context}\n\n"
            f"Pregunta: {question}"
        )

    try:
        async with _get_anthropic().messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except anthropic.APIError as exc:
        logger.error("Anthropic API error: %s", exc)
        yield "Error al generar respuesta. Por favor intentá de nuevo."


def is_question(text: str) -> bool:
    """
    Heuristic: detect if the final transcript is a question worth answering.
    Returns True if the text looks like a question.
    """
    text = text.strip()
    if not text:
        return False

    # Explicit question marks (Spanish + English)
    if "?" in text or "¿" in text:
        return True

    # Common question starters in Spanish and English
    question_starters_es = (
        "qué", "que", "cómo", "como", "cuándo", "cuando",
        "dónde", "donde", "quién", "quien", "cuál", "cual",
        "cuánto", "cuanto", "por qué", "para qué",
        "podés", "puedes", "podrías", "podrías", "pueden",
        "explicá", "explica", "contame", "cuéntame", "describí",
        "hablame", "decime",
    )
    question_starters_en = (
        "what", "how", "when", "where", "who", "which", "why",
        "can you", "could you", "would you", "do you", "did you",
        "tell me", "explain", "describe", "walk me through",
    )

    lower = text.lower()
    starters = question_starters_es + question_starters_en
    return any(lower.startswith(s) for s in starters)
