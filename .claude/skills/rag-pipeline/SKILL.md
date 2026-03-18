---
name: rag-pipeline
description: Pipeline RAG completo de Telepromt IA. Invocar cuando se trabaja en ingesta de documentos, generación de embeddings, búsqueda semántica con pgvector, o cuando el usuario dice "RAG", "embeddings", "base de conocimiento", "procesar documento" o "búsqueda semántica". Stack: OpenAI text-embedding-3-small (1536 dims) + pgvector HNSW en Supabase.
---

# RAG Pipeline — Telepromt IA

## Arquitectura
```
Documento (PDF/DOCX/MD) → Extracción texto → Chunking (600 tokens, 50 overlap)
→ Embeddings (OpenAI batch) → Supabase pgvector (HNSW) → Retrieval (cosine, top-5)
→ Claude API (streaming) → Respuesta en overlay
```

## 1. Extractor (backend/services/rag/extractor.py)
```python
import pdfplumber, mammoth
from pathlib import Path

async def extract_text(file_path: str, mime_type: str) -> str:
    path = Path(file_path)
    if mime_type == "application/pdf":
        parts = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text: parts.append(text)
        return "\n\n".join(parts).strip()
    elif "wordprocessingml" in mime_type:
        with open(path, "rb") as f:
            return mammoth.extract_raw_text(f).value.strip()
    return path.read_text(encoding="utf-8").strip()
```

## 2. Chunker (backend/services/rag/chunker.py)
```python
import re
from dataclasses import dataclass
from typing import List

@dataclass
class Chunk:
    content: str
    chunk_index: int

def chunk_text(text: str, max_tokens: int = 600, overlap_tokens: int = 50) -> List[Chunk]:
    sentences = re.split(r'(?<=[.!?])\s+', text.replace('\n\n', '. '))
    sentences = [s.strip() for s in sentences if s.strip()]
    chunks, current, idx = [], "", 0
    for sentence in sentences:
        candidate = (current + " " + sentence).strip()
        if len(candidate) // 4 > max_tokens and current:
            chunks.append(Chunk(content=current.strip(), chunk_index=idx))
            idx += 1
            words = current.split()
            current = " ".join(words[-(overlap_tokens//6):]) + " " + sentence
        else:
            current = candidate
    if current.strip():
        chunks.append(Chunk(content=current.strip(), chunk_index=idx))
    return chunks
```

## 3. Embeddings (backend/services/rag/embeddings.py)
```python
from openai import AsyncOpenAI
import os
client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

async def embed_texts(texts: list[str]) -> list[list[float]]:
    all_embs = []
    for i in range(0, len(texts), 100):
        batch = [t.replace("\n", " ") for t in texts[i:i+100]]
        resp = await client.embeddings.create(model="text-embedding-3-small", input=batch)
        all_embs.extend([item.embedding for item in resp.data])
    return all_embs

async def embed_query(query: str) -> list[float]:
    return (await embed_texts([query]))[0]
```

## 4. Retrieval (backend/services/rag/retrieval.py)
```python
from .embeddings import embed_query
from dataclasses import dataclass

@dataclass
class RetrievedChunk:
    id: str; content: str; document_id: str; similarity: float

async def retrieve_chunks(supabase, query: str, user_id: str,
                           threshold: float = 0.7, count: int = 5) -> list[RetrievedChunk]:
    embedding = await embed_query(query)
    result = await supabase.rpc("search_documents", {
        "query_embedding": embedding, "match_threshold": threshold,
        "match_count": count, "p_user_id": user_id
    }).execute()
    return [RetrievedChunk(id=r["id"], content=r["content"],
                            document_id=r["document_id"], similarity=r["similarity"])
            for r in (result.data or [])]
```

## 5. Generator con streaming (backend/services/llm/generator.py)
```python
import anthropic, os
from typing import AsyncGenerator
claude = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM = """Sos el asistente de {name}, {role}, aplicando en {company}.
IDIOMA: Respondé SIEMPRE en {language}. Traducí internamente el CV si es necesario.
PERFIL: {context}
REGLAS: Profesional senior en entrevista real. 30-90 seg al leer. Estructura STAR cuando corresponda.
Nunca inventar métricas. Natural y hablado, no documento escrito."""

async def generate_stream(question: str, chunks: list, config: dict) -> AsyncGenerator[str, None]:
    context = "\n\n".join(f"[Fuente {i+1}]\n{c.content}" for i, c in enumerate(chunks)) \
              if chunks else "Sin información específica en la base de conocimiento."
    async with claude.messages.stream(
        model="claude-sonnet-4-5", max_tokens=400,
        system=SYSTEM.format(**config, context=context),
        messages=[{"role": "user", "content": question}]
    ) as stream:
        async for text in stream.text_stream:
            yield text
    yield f"\n[source:{'knowledge_base' if chunks else 'general'}]"
```

## Debugging
```sql
-- pgvector habilitado?
SELECT extname FROM pg_extension WHERE extname = 'vector';
-- Chunks del usuario
SELECT COUNT(*), document_id FROM document_chunks WHERE user_id = '[uid]' GROUP BY document_id;
-- Dimensiones correctas (1536)
SELECT array_length(embedding::float[], 1) FROM document_chunks LIMIT 3;
```
