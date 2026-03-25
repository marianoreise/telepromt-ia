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

## Reglas de routing de agentes

Usar esta tabla para decidir qué agente invocar según el input del usuario.
Invocar siempre el agente más específico disponible — no resolver en el orquestador lo que un agente especializado puede hacer mejor.

### Tabla de routing por intención

| Señal del usuario | Comando / Agente | Notas |
|---|---|---|
| "Quiero una feature X", objetivo de negocio nuevo | `/nueva-feature` | Pipeline completo de 13 pasos |
| "Cómo vamos", "en qué estamos", "qué está bloqueado" | `project-manager` | Briefing ejecutivo al inicio de sesión |
| "Hay un bug en X", error reportado | `/debug` | Ciclo autónomo: fix → test → review → judge |
| Feature con reglas de negocio ambiguas o complejas | `functional-analyst` | Invocar DESPUÉS de product-lead y ANTES de architect |
| "Diseñá la arquitectura de X", nuevas tablas/endpoints | `architect` | Requiere Feature Spec lista. Produce ADR + migration + openapi + briefs |
| Implementar routes FastAPI, servicios backend, RAG, webhooks | `backend` | Requiere brief del architect |
| Crear páginas Next.js, componentes React, UI desktop overlay | `frontend` | Requiere brief del architect |
| GitHub Actions, Dockerfile, Railway, Vercel, env vars, CI/CD | `devops` | Invocar cuando hay build/deploy fallido o configuración nueva |
| Supabase Auth, RLS policies, JWT, OAuth, errores 401/403 | `auth-specialist` | Invocar para TODA tabla nueva que necesite RLS o flujo de auth |
| Nuevas migraciones SQL, pgvector, índices, queries lentas | `database-specialist` | Usa skill /db-migration. Invocar cuando architect define tablas nuevas |
| Pre-merge a main, pre-deploy, "auditá la seguridad" | `security-specialist` | Poder de veto. SIEMPRE antes de mergear a main |
| Feature completa, coverage < 80%, "generá tests" | `testing-specialist` | Usa skill /test-generator. Coverage mínimo 80% |
| UI completa, "revisá la UX", "es fácil de usar?" | `ux-reviewer` | Evalúa con 10 principios de Nielsen |
| "Diseñá la pantalla de X", problemas visuales detectados | `ui-designer` | Diseñar ANTES de que frontend codee, no después |
| Textos de UI, mensajes de error, copy de onboarding | `copywriter` | Español LATAM natural. Invocar cuando hay textos en inglés en desktop |
| Latencia > targets, overlay lento, memory leak, "está lento" | `performance-specialist` | Poder de bloqueo. Métricas: STT <1.5s, LLM <3s, API <500ms |
| Usuarios reales, "cómo están las métricas", funnel analysis | `growth-analyst` | Solo invocar cuando hay usuarios reales usando el producto |
| "Documentá X", guía de usuario, FAQ, release notes | `documentation-writer` | Genera docs en docs/user/ (ES) y docs/api/ (EN) |
| Error con Deepgram, Claude API, OpenAI, Tavily, Mercado Pago | `api-integrations-specialist` | Diagnóstico: credentials → connectivity → SDK version → status page |
| Sprint completo con tests OK, "preparar el release" | `release-manager` | Requiere: tests ✅ + build ✅ + security ✅ |
| 3-5 min después de un deploy a producción | `deploy-validator` | Smoke tests HTTP/API. Siempre junto a ux-reviewer + ui-designer en /post-deploy |
| Antes de cualquier implementación, "¿dónde está X en el código?" | `explorer` | SOLO lectura. Mapea archivos, patterns, convenciones |
| Feature compleja que necesita descomposición en subtareas | `planner` | Output: tabla de tareas con agente, dependencias, parallelismo |
| Agente terminó implementación, "revisá el código" | `reviewer` | Revisión rápida: correctness + consistencia + seguridad básica |
| Feature implementada, "validar contra spec" | `judge` | Verifica CAs uno a uno. Binario: COMPLETO / INCOMPLETO |

### Routing por tipo de error

| Error observado | Agente primario | Agente secundario |
|---|---|---|
| 401 / 403 | `auth-specialist` | `security-specialist` |
| 500 / crash FastAPI | `backend` | `testing-specialist` |
| 404 / import roto | `explorer` (localizar) → `backend` o `frontend` | — |
| RLS mal configurado | `auth-specialist` | `database-specialist` |
| Deepgram / STT desconectado | `api-integrations-specialist` | `backend` |
| CORS bloqueando | `backend` (FastAPI CORS) o `devops` (headers infra) | — |
| Build TypeScript fallando | `frontend` o `backend` (según superficie) | `reviewer` |
| WebSocket cayendo | `backend` (reconexión) + `api-integrations-specialist` | — |
| Overlay no responde a clicks | `frontend` (Tauri setIgnoreMouseEvents) | `performance-specialist` |
| Query SQL lenta | `database-specialist` | `performance-specialist` |
| Migración Supabase fallida | `database-specialist` | `auth-specialist` (si es tabla con RLS) |
| Credits no acreditados | `backend` (webhook handler) | `api-integrations-specialist` (Mercado Pago) |
| Memory leak overlay | `performance-specialist` | `frontend` |

### Flujo para nueva feature (siempre /nueva-feature)

```
product-lead → functional-analyst → architect
     ↓
database-specialist (migration) + auth-specialist (RLS)
     ↓
backend + frontend [paralelo] + devops
     ↓
testing-specialist → reviewer → security-specialist → judge
     ↓
COMPLETO → /pre-deploy → CI/CD → /post-deploy
```

### Skills — cuándo invocarlos

| Skill | Cuándo invocar |
|---|---|
| `/rag-pipeline` | Implementar o modificar el pipeline de embeddings + búsqueda vectorial (CV→pgvector→Claude) |
| `/frontend-design` | Crear UI nueva o mejorar componentes existentes que necesitan diseño distintivo |
| `/supabase-postgres-best-practices` | Escribir, revisar u optimizar queries SQL, schema o configuración de Postgres |
| `/vercel-react-best-practices` | Revisar o refactorizar componentes React/Next.js para performance óptima |
| `/security-audit` | Auditoría de seguridad completa (invocado por security-specialist) |
| `/test-generator` | Generar suites de tests con los templates del stack (invocado por testing-specialist) |
| `/git-workflow` | Gestionar commits semánticos + tags de versión (invocado por release-manager) |
| `/db-migration` | Ejecutar migraciones SQL en Supabase (invocado por database-specialist) |
| `/api-spec` | Crear o actualizar openapi.yaml (invocado por architect) |

### Paralelismo permitido

Los siguientes agentes pueden correr en paralelo sin dependencias entre sí:
- `backend` + `frontend` (si no comparten tipos, sino esperar brief del architect)
- `deploy-validator` + `ux-reviewer` + `ui-designer` (en /post-deploy siempre los 3 juntos)
- `explorer` + cualquier agente de planeación

Los siguientes agentes son SIEMPRE secuenciales (el siguiente depende del anterior):
- `product-lead` → `functional-analyst` → `architect`
- `database-specialist` → `backend` (no implementar antes de que exista la migración)
- `testing-specialist` → `reviewer` → `security-specialist` → `judge` (pipeline de validación)
- `release-manager` → CI/CD → `deploy-validator`

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
