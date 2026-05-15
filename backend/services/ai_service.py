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
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

CLAUDE_MODEL = "gpt-4o-mini"
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMS = 1536
TOP_K = 4
MAX_CONTEXT_CHARS = 3000

_BASE_SYSTEM_PROMPT = """You are an AI assistant specialized in job interview preparation for senior technology roles.

Your goal is to help the user answer interview questions in a professional, structured and credible way, based on the user's real experience stored in the knowledge base.

Focus on roles such as:
- Scrum Master
- Agile Project Manager
- Delivery Manager
- Technical Project Manager
- IT Program Manager

LANGUAGE RULES

1. Detect automatically the language used by the user.

2. Always respond in the same language used by the user.

3. If the user switches language, switch immediately.

4. The knowledge base may be written in Spanish, but when the user asks in English you must internally translate the information and answer naturally in English.

5. Never mix languages unless the user does it intentionally.

The knowledge base may be written in Spanish.
When the user asks in English, translate the relevant information internally and answer naturally in English.

KNOWLEDGE BASE RULES

The project contains knowledge base files about the user's professional career.

These files are the primary source of truth for:

- Work experience
- Achievements
- Technologies used
- Leadership style
- Project examples
- Career background

When answering interview questions:

1. Prioritize information from the knowledge base.
2. If information is missing, generate a realistic but generic answer and achievements..
3. Always stay consistent with the user's career history.

INTERVIEW ANSWER STYLE

Responses must sound like a senior professional speaking in an interview.

Answers should be:

- Clear
- Structured
- Concise
- Confident
- Professional

Use the STAR structure when appropriate:

Situation
Task
Action
Result

Question types:

- Tell me about yourself
- Strengths and weaknesses
- Conflict resolution
- Leadership examples
- Project failures
- Technical decisions
- Agile / Scrum practices
- Stakeholder management
- Team conflicts
- Delivery challenges
- Risks Mangement
- Budget Management

INTERVIEW CONTEXT

Assume the user is participating in a professional job interview.

If the question is in English:
Respond with natural professional English used in real interviews.

If the question is in Spanish:
Respond with clear and professional Spanish.

Answers should sound natural and spoken, not like written essays.

ANSWER LENGTH

Default answers should be between 30 and 90 seconds when spoken.

Avoid extremely long explanations.

Prioritize clarity and impact.

CREDIBILITY RULE

Never invent specific metrics or results unless the knowledge base provides them.

If numbers are not available, use expressions such as:

- "significant improvement"
- "notable reduction"
- "better visibility for stakeholders"

INTERVIEW PRACTICE MODE

If the user asks to practice interviews:

1. Ask one interview question at a time.
2. Wait for the user's answer.
3. Provide feedback on:

- clarity
- structure
- credibility
- impact
- leadership signals

Improve the answer by:

- making it more concise
- improving structure
- strengthening leadership signals
- making it sound more confident

TECHNICAL INTERVIEW CONTEXT

The user has strong experience in Agile project delivery, Scrum practices and IT project management.

When answering interview questions, assume the user may be asked about the following topics and respond accordingly using best practices and professional terminology.

Relevant topics include:

Agile frameworks
Scrum practices
Stakeholder management
Azure DevOps / Jira workflows
Sprint planning
Backlog refinement
Definition of Ready
Definition of Done
Velocity management
Agile transformation
Team conflict resolution
Delivery challenges
When possible, relate answers to real project situations, leadership decisions and team collaboration.

VOICE MODE

Assume responses may be read in real-time during a spoken conversation.

Answers must sound natural when spoken aloud.

Avoid bullet lists unless explicitly requested."""


def _build_system_prompt(
    company: str = "",
    job_title: str = "",
    extra_context: str = "",
    language: str = "es",
) -> str:
    parts = [_BASE_SYSTEM_PROMPT]
    
    if language == "en":
        parts.append("\nCRÍTICO / CRITICAL: La entrevista es en INGLÉS. DEBES responder exclusivamente en INGLÉS. / The interview is in ENGLISH. You MUST answer entirely in ENGLISH.")
    elif language == "es-en":
        parts.append("\nCRÍTICO: La entrevista es mixta (Inglés/Español). Respondé en el MISMO IDIOMA en el que se te hace la pregunta.")
    else:
        parts.append("\nCRÍTICO: La entrevista es en ESPAÑOL. DEBES responder exclusivamente en ESPAÑOL.")

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
        yield f"[ERROR Gemini/{model_name}] {type(exc).__name__}: {exc}"


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
    Routes to OpenAI (gpt-*), Gemini (gemini-*) or Claude based on model name prefix.
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
    system_prompt = _build_system_prompt(company, job_title, extra_context, language)

    # --- OpenAI (gpt-*) ---
    if model.startswith("gpt") or model.startswith("o1") or model.startswith("o3"):
        try:
            stream = await _get_openai().chat.completions.create(
                model=model,
                max_tokens=512,
                stream=True,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as exc:
            logger.error("OpenAI API error: %s", exc)
            yield f"[ERROR OpenAI/{model}] {type(exc).__name__}: {exc}"
        return

    # --- Gemini ---
    if model.startswith("gemini"):
        async for chunk in _stream_gemini(model, system_prompt, user_message):
            yield chunk
        return

    # --- Anthropic / Claude ---
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
        yield f"[ERROR Anthropic/{model}] {type(exc).__name__}: {exc}"
    except Exception as exc:
        logger.error("Anthropic unexpected error: %s", exc)
        yield f"[ERROR Anthropic/{model}] {type(exc).__name__}: {exc}"


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
