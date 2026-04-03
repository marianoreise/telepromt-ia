"""AI response generation with Claude / Gemini + optional RAG context."""
import os
import logging
from typing import AsyncGenerator

import anthropic
import google.generativeai as genai
from openai import AsyncOpenAI
from supabase import create_client, Client

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

CLAUDE_MODEL = "claude-sonnet-4-5"
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMS = 1536
TOP_K = 4
MAX_CONTEXT_CHARS = 3000

_BASE_SYSTEM_PROMPT = """Sos un asistente de entrevistas en tiempo real. Tu trabajo es ayudar al candidato a responder preguntas durante su entrevista de trabajo.

CRÍTICO: Escribí las respuestas EN PRIMERA PERSONA como si fueras el candidato hablando. Nunca te presentes como IA ni menciones que sos Claude o un asistente. Respondé directamente como si fueras la persona entrevistándose.

Ejemplos correctos:
- "Tengo 5 años de experiencia en desarrollo backend con Python..."
- "En mi último proyecto lideré un equipo de 4 personas..."
- "Mi mayor fortaleza es la capacidad de aprender rápido..."

Reglas:
- Máximo 3-4 oraciones (a menos que se pida más detalle)
- Primera persona siempre ("Tengo", "Trabajé", "Mi experiencia...", "I have", "I worked")
- Sin markdown — texto plano
- Respondé en el mismo idioma que la pregunta
- Si hay datos del CV, usalos para personalizar la respuesta
- Empezá directo con la respuesta, sin preámbulos"""


def _build_system_prompt(
    company: str = "",
    job_title: str = "",
    extra_context: str = "",
) -> str:
    parts = [_BASE_SYSTEM_PROMPT]
    if company or job_title:
        parts.append(
            f"\nContexto de la entrevista: el candidato está entrevistando"
            + (f" para el puesto de {job_title}" if job_title else "")
            + (f" en {company}" if company else "")
            + "."
        )
    if extra_context:
        parts.append(f"\nInstrucciones adicionales: {extra_context}")
    return "".join(parts)

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


async def _stream_gemini(
    model_name: str,
    system_prompt: str,
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Stream response from Google Gemini."""
    if not GOOGLE_API_KEY:
        yield "Error: GOOGLE_API_KEY no configurada en el servidor."
        return
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_prompt,
        )
        response = await model.generate_content_async(
            user_message,
            stream=True,
            generation_config=genai.types.GenerationConfig(max_output_tokens=512),
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as exc:
        logger.error("Gemini API error: %s", exc)
        yield "Error al generar respuesta. Por favor intentá de nuevo."


async def stream_ai_response(
    user_id: str,
    question: str,
    language: str = "es",
    company: str = "",
    job_title: str = "",
    extra_context: str = "",
    ai_model: str = "",
) -> AsyncGenerator[str, None]:
    """
    Stream AI response for a given question.
    Routes to Claude (Anthropic) or Gemini (Google) based on model name prefix.
    Retrieves RAG context from user's knowledge base first.
    Yields text chunks as they arrive.
    """
    context = await _retrieve_context(user_id, question)

    user_message = question
    if context:
        user_message = (
            f"Información de mi CV/perfil:\n{context}\n\n"
            f"Pregunta de la entrevista: {question}"
        )

    model = ai_model if ai_model else CLAUDE_MODEL
    system_prompt = _build_system_prompt(company, job_title, extra_context)

    if model.startswith("gemini"):
        async for chunk in _stream_gemini(model, system_prompt, user_message):
            yield chunk
        return

    try:
        async with _get_anthropic().messages.stream(
            model=model,
            max_tokens=512,
            system=system_prompt,
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
