# Telepromt IA — Contexto Maestro del Proyecto

## Producto
Asistente IA en tiempo real para videollamadas y entrevistas. Escucha el audio del
sistema, transcribe, detecta preguntas y muestra respuestas IA como teleprompter —
completamente invisible para los demás participantes.

Superficies:
- Web App (Next.js 14) → cuenta, CV/resume, sesiones, billing
- Desktop App (Tauri v2 + React, SOLO Windows win32 x64) → overlay, WASAPI audio

## Stack aprobado — no cambiar sin ADR

| Capa | Tecnología |
|---|---|
| Frontend web | Next.js 14 · TypeScript strict · Tailwind · shadcn/ui |
| Desktop | Tauri v2 + React · solo Windows win32 x64 |
| Backend | FastAPI Python 3.11 · Railway |
| Auth + DB | Supabase · PostgreSQL 15 + pgvector + Auth + Storage |
| STT | Deepgram Nova-2 · WebSocket streaming |
| LLM | Claude Sonnet API (claude-sonnet-4-5) |
| Embeddings | OpenAI text-embedding-3-small · 1536 dims |
| Web search | Tavily API |
| Pagos | Mercado Pago (créditos por sesión) |
| Deploy web | Vercel |
| Deploy backend | Railway |
| CI/CD | GitHub Actions |

## Modelo de negocio — CRÉDITOS
- Plan Gratuito: sesiones de 10 minutos sin costo
- Plan Pago: 0.5 créditos / 30 min de sesión activa
- Auto-extend al llegar a 30 segundos restantes

## Reglas de código — sin excepciones
- TypeScript strict mode · cero `any`
- Nunca hardcodear credenciales · siempre process.env / os.environ
- NUNCA modificar .env* sin confirmación del humano
- RLS en TODA tabla de Supabase desde su migración
- Commits semánticos: tipo(scope): descripción en español
- Cobertura mínima de tests: 80% en módulos nuevos
- Al finalizar cada feature o módulo: ejecutar test de regresión completo ANTES del commit · NO commitear si algún test falla
- API routes Next.js: siempre getUser() · NUNCA getSession()
- Desktop: SOLO Windows · nunca generar código macOS/CoreAudio/DMG

## Equipo de agentes
TIER 1: product-lead (Opus)
TIER 2: architect · backend · frontend · devops (Sonnet)
TIER 3: auth-specialist · database-specialist · security-specialist · testing-specialist · ux-reviewer · ui-designer (Sonnet)
TIER 4: release-manager · deploy-validator (Sonnet)
TIER 5: explorer · planner · reviewer · judge (Haiku)

## Reglas de smoke test — sin excepciones
Cada vez que el humano pida un smoke test (o se ejecute /post-deploy), SIEMPRE invocar los 3 agentes:
1. `deploy-validator` → validación técnica (HTTP, API, rutas)
2. `ux-reviewer` → revisión de usabilidad de las pantallas modificadas
3. `ui-designer` → revisión de consistencia visual con el sistema de diseño

## Skills disponibles
Globales (~/.claude/skills/): /security-audit · /test-generator · /git-workflow · /db-migration · /api-spec
Proyecto (.claude/skills/): /rag-pipeline

## Comandos (.claude/commands/)
/nueva-feature · /pre-deploy · /post-deploy · /sprint-review · /debug

## Roadmap
Sprint 1-2: Auth + Dashboard base + CI/CD
Sprint 3:   Desktop overlay Windows (5 features invisibilidad)
Sprint 4-5: Audio WASAPI + Deepgram STT + Motor IA en tiempo real
Sprint 6:   Mercado Pago + sistema de créditos
Sprint 7-8: QA + build .exe + lanzamiento v1.0.0

## Archivos clave
CLAUDE.md · docs/AGENT-WORKFLOW.md · docs/api/openapi.yaml · supabase/migrations/
