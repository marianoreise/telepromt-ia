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

## Decisiones de producto — sin excepciones
- El campo "Perfil Profesional" (h2/título dentro del card de Settings) fue eliminado permanentemente — NO volver a agregarlo. El card de configuración NO tiene título, solo tiene los campos directamente.
- La aplicación desktop se llama **ListnrIO** — este es el nombre que debe aparecer en la UI del desktop app. NUNCA usar "Telepromt IA" en la interfaz del desktop.
- Toda la UI del desktop app debe estar en **español** — sin excepción. Cualquier texto en inglés en el desktop app debe traducirse al castellano.
- El selector de idioma de sesión tiene 3 opciones: **Castellano · Inglés · Cast/Eng** (la tercera opción es para entrevistas mixtas en castellano e inglés).
- **Auth del desktop app requiere sesión web activa** — el usuario DEBE estar logueado en la web app (listnr.io) para que el desktop sincronice usuario, créditos y sesiones. El flujo es: abrir web → loguear → la web emite deep link `listnr://auth?token=...` → desktop recibe el token y queda autenticado. Sin sesión web activa, el desktop solo muestra la pantalla de login.

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
- Desktop build: NUNCA usar `cargo build` directamente — Tauri 2 requiere `tauri dev` o `tauri build` (el build script necesita el contexto de la CLI de Tauri)

## Regla de fix obligatoria
Después de CUALQUIER corrección de bug o fix de funcionalidad:
1. El agente testing-specialist ejecuta los tests del módulo afectado
2. El agente reviewer revisa el diff del fix
3. El agente judge confirma que los criterios de aceptación se cumplen
4. Solo después de que judge diga COMPLETO → reportar al humano que está listo
NUNCA reportar un fix como resuelto sin haber pasado por estos 3 agentes.

## Equipo de agentes
TIER 0: project-manager (Opus) — briefing ejecutivo al inicio de sesión
TIER 1: product-lead (Opus)
TIER 1.5: functional-analyst (Sonnet) — entre product-lead y architect
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

---

## Modo Debug Autónomo

Ante cualquier bug reportado — ya sea en la web app, el desktop overlay o
la comunicación entre capas — activar este flujo automáticamente sin que
el usuario lo solicite.

### 1. Análisis previo obligatorio (antes de tocar código)

Para cada síntoma reportado, documentar:
- Qué archivo, componente, endpoint o servicio está fallando
- Cuál es la causa raíz (no el síntoma superficial)
- Qué se va a cambiar, en qué archivo y por qué eso resuelve el problema
- Si el fix puede generar efectos secundarios en otras partes del sistema

### 2. Clasificación y prioridad de bugs

Corregir en este orden de criticidad:

**CRÍTICO — detiene el uso del producto**
- Errores 500 / crashes del backend (FastAPI)
- Autenticación rota: JWT inválido, sesión expirada sin renovación, OAuth fallando
- Pagos: webhooks de Mercado Pago sin procesar, créditos no acreditados
- Audio/STT: WASAPI no captura, WebSocket de Deepgram desconectado
- Build del desktop fallando: el .exe no compila o no instala

**ALTO — funcionalidad core degradada**
- Desincronización frontend/backend: datos que se muestran distintos a los guardados
- Comunicación rota con APIs externas (Deepgram, OpenAI, Tavily, Anthropic)
- Errores 401/403: permisos incorrectos, RLS de Supabase mal configurado
- Errores 404: rutas inexistentes, endpoints movidos, imports rotos
- Race conditions: respuestas fuera de orden, estados inconsistentes
- Variables de entorno faltantes o mal referenciadas en producción
- CORS bloqueando llamadas del frontend al backend
- WebSocket cayendo sin reconexión automática

**MEDIO — experiencia degradada**
- Pantallas cortadas, layout roto, overflow sin scroll
- Texto o mensajes truncados en cualquier componente
- Botones sin respuesta: event handlers, z-index, setIgnoreMouseEvents
- Formularios que no validan o no envían datos correctamente
- Estados de carga infinita: spinners que nunca resuelven
- Caché desactualizado: datos viejos mostrándose después de un update
- Errores de TypeScript en runtime que no se detectaron en build
- Queries SQL lentas o sin índice bloqueando respuestas

**BAJO — polish y robustez**
- Problemas de invisibilidad del overlay (WDA_EXCLUDEFROMCAPTURE, skipTaskbar)
- Mensajes de error genéricos sin contexto útil para el usuario
- Logs insuficientes que dificultan el debugging futuro
- Memory leaks en el overlay de Windows
- Retry logic faltante en llamadas a APIs externas
- Falta de feedback visual en acciones async (optimistic UI)

### 3. Tests a ejecutar después de cada corrección

Sin excepción, correr automáticamente:

- **Unitarios**: funciones de negocio críticas (auth, créditos, RAG, detección de idioma)
- **Integración**: flujo completo entre capas (frontend → backend → Supabase → API externa)
- **API**: cada endpoint modificado responde con el status code y payload correctos
- **Seguridad**: RLS activo en Supabase, variables de entorno no expuestas al cliente, inputs sanitizados
- **WebSocket**: conexión de Deepgram establece, recibe chunks y reconecta ante caída
- **Desktop**: shortcuts globales funcionan, botones del overlay responden, invisibilidad activa
- **Build**: el proyecto compila sin errores de TypeScript y sin warnings críticos
- **E2E**: flujo mínimo del usuario (login → crear sesión → transcripción → respuesta IA)

### 4. Comportamiento autónomo en el ciclo de corrección

- Si durante los tests se descubren nuevos issues: corregirlos en el mismo ciclo y volver a testear
- No pedir confirmación para continuar — solo detenerse ante: API keys faltantes,
  intervención de hardware necesaria, o acción irreversible en producción (drop de tabla, etc.)
- Si un fix introduce una regresión en otro módulo: revertirlo, documentar el conflicto
  y proponer una solución alternativa antes de continuar
- Máximo 3 ciclos de corrección sobre el mismo bug antes de escalar al usuario
  con un análisis detallado de por qué no se resuelve

### 5. Reporte obligatorio al finalizar cada ciclo

- Lista de bugs corregidos: archivo, línea y descripción del cambio
- Output completo de los tests: qué pasó, qué falló, qué se corrigió en el ciclo
- Deuda técnica detectada: issues encontrados que no se corrigieron en este ciclo y por qué
- Estado actual del sistema: qué funciona, qué está pendiente
- Próximo paso recomendado

Hacer commit al finalizar cada ciclo completo con el formato:
fix: [superficie afectada] [descripción breve] — ej: fix: overlay botón AI Answer no respondía al click
