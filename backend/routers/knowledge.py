"""Knowledge base management: CV/document upload → chunking → embedding → pgvector."""
import io
import logging
import os
from typing import Annotated

import pdfplumber
import mammoth
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from supabase import create_client

from middleware.auth import UserContext, get_current_user
from services.ai_service import _embed_text
from services.text_utils import chunk_text

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/knowledge", tags=["knowledge"])

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

MAX_FILE_SIZE = 5 * 1024 * 1024   # 5 MB


def _get_supabase():
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def _extract_text(filename: str, content: bytes) -> str:
    """Extract plain text from PDF or DOCX."""
    if filename.lower().endswith(".pdf"):
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
        return "\n\n".join(text_parts)

    if filename.lower().endswith((".docx", ".doc")):
        result = mammoth.extract_raw_text(io.BytesIO(content))
        return result.value

    if filename.lower().endswith(".txt"):
        return content.decode("utf-8", errors="replace")

    raise ValueError(f"Formato no soportado: {filename}")


class KnowledgeDeleteRequest(BaseModel):
    source_name: str


class KnowledgeListItem(BaseModel):
    id: str
    source_name: str
    chunk_count: int
    created_at: str


@router.post("/upload")
async def upload_document(
    file: Annotated[UploadFile, File(description="PDF, DOCX, o TXT (máx 5 MB)")],
    user: UserContext = Depends(get_current_user),
) -> dict:
    """Upload a document to the user's knowledge base."""
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx 5 MB)")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx 5 MB)")

    try:
        text = _extract_text(file.filename or "unknown", content)
    except ValueError as exc:
        raise HTTPException(status_code=415, detail=str(exc))
    except Exception as exc:
        logger.error("Text extraction error: %s", exc)
        raise HTTPException(status_code=422, detail="Error al procesar el documento")

    if not text.strip():
        raise HTTPException(status_code=422, detail="El documento no contiene texto extraíble")

    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No se pudieron extraer fragmentos del documento")

    source_name = file.filename or "documento"
    db = _get_supabase()

    # Remove old chunks for this source
    db.from_("knowledge_chunks").delete().eq("user_id", user.id).eq("source_name", source_name).execute()

    # Embed and insert each chunk
    inserted = 0
    for chunk in chunks:
        try:
            embedding = await _embed_text(chunk)
            db.from_("knowledge_chunks").insert({
                "user_id": user.id,
                "source_name": source_name,
                "content": chunk,
                "embedding": embedding,
            }).execute()
            inserted += 1
        except Exception as exc:
            logger.warning("Chunk embedding failed: %s", exc)

    if inserted == 0:
        raise HTTPException(status_code=500, detail="Error al indexar el documento")

    logger.info("User %s uploaded '%s' → %d chunks", user.id, source_name, inserted)
    return {"source_name": source_name, "chunks_indexed": inserted, "chunks_created": inserted}


@router.get("/sources")
async def list_sources(user: UserContext = Depends(get_current_user)) -> list[dict]:
    """List all knowledge sources for the current user."""
    db = _get_supabase()
    result = (
        db.from_("knowledge_chunks")
        .select("source_name, id, created_at")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
        .execute()
    )
    # Group by source_name
    sources: dict[str, dict] = {}
    for row in result.data or []:
        sn = row["source_name"]
        if sn not in sources:
            sources[sn] = {"source_name": sn, "chunk_count": 0, "created_at": row["created_at"]}
        sources[sn]["chunk_count"] += 1

    return list(sources.values())


@router.delete("/sources/{source_name}")
async def delete_source(
    source_name: str,
    user: UserContext = Depends(get_current_user),
) -> dict:
    """Delete all chunks for a given source."""
    db = _get_supabase()
    result = (
        db.from_("knowledge_chunks")
        .delete()
        .eq("user_id", user.id)
        .eq("source_name", source_name)
        .execute()
    )
    count = len(result.data) if result.data else 0
    return {"deleted_chunks": count}
