# Changelog — listnr.io

Historial de cambios ordenado por fecha. Formato semántico: `feat` / `fix` / `chore`.

---

## [Unreleased] — Deuda técnica pendiente

- RoleCombobox: reescribir con Popover/Command de shadcn (actualmente usa inline styles sin focus ring)
- Toggle wizard: color activo `bg-blue-600` → `#1B6CA8` + agregar focus ring WCAG
- Step indicator wizard: `bg-blue-500` → `#1B6CA8`
- Transcripción sesión activa: distinguir hablantes (Entrevistador vs Candidato)
- Validación inline en campo Puesto cuando se elige "Otro" y se deja vacío
- Botón flotante IA: agregar `relative` al contenedor padre de `ActiveSessionView`

---

## 2026-04-02 — Polish, IA contextual, transcripción y onboarding

### Features
- **Panel Respuestas IA**: muestra `PREGUNTA` (detectada del entrevistador) y `RESPUESTA` (generada) por cada interacción
- **Wizard Puesto**: campo reemplazado por `RoleCombobox` con 30+ roles en categorías + buscador + "Otro"
- **Logos plataformas**: SVGs oficiales de Google Meet, Zoom, Teams, WebEx y Slack en pantalla de conexión
- **Wizard**: paso "Listo para crear" (resumen) eliminado — de 7 a 6 pasos

### Fixes
- **STT bilingüe**: modo `es-en` (Cast/Ing) usa `detect_language: true` en Deepgram — antes caía en `en-US` y no transcribía español
- **IA contextual**: system prompt reescrito — Claude responde en primera persona como el candidato (nunca como asistente IA). Empresa, puesto, instrucciones extra y modelo IA viajan en el handshake WebSocket
- **Transcripción guardada**: `session_id` real de la DB se envía en el handshake; guardado usa `httpx` directo (evita 403 del SDK Supabase con RLS)
- **Pantalla sesión finalizada**: botones siempre visibles — "Mis sesiones" + "Transcripción" (deshabilitado si no hay transcript). Líneas vacías filtradas, scroll con `pb-2`
- **Dashboard onboarding**: pasos basados en datos reales — perfil completo (nombre + rol), CV subido (chunks count), sesiones realizadas (sessions count). Ya no depende de `onboarding_step` manual
- **Dashboard paso 3**: texto cambiado a "Sesiones realizadas"
- **Configuración**: fix `permission denied for table user_profiles` — `GRANT ALL ON user_profiles TO authenticated` en Supabase

---

## 2026-03-XX — Sprint 6: Sistema de créditos + Mercado Pago

### Features
- Sistema de créditos: plan gratuito (10 min/sesión sin costo) + plan pago (0.5 créditos / 30 min)
- Integración Mercado Pago — preferencia de pago, precios en ARS, IPN webhook con HMAC-SHA256
- Idempotencia en créditos: verifica `mp_payment_id` antes de acreditar para evitar doble cobro
- Bono de bienvenida: 2 créditos (60 minutos) al crear perfil — trigger SQL automático
- Billing tracker en WebSocket STT — descuenta créditos cada 30 min de sesión activa
- Watchdog de sesión gratuita: aviso a 30 segundos + corte a los 10 minutos
- Vista de créditos disponibles en dashboard con minutos restantes
- Página de billing con 3 paquetes: Starter / Pro / Max

### Fixes
- Policies `service_role` en `user_credits` y `credit_transactions`
- SDK Supabase reemplazado por `httpx` directo en endpoints de créditos (fix 403 RLS)
- Precios en ARS y `back_url` corregida a `/billing`

---

## 2026-03-XX — Sprint 4-5: Audio WASAPI + Deepgram STT + Motor IA

### Features
- Integración Deepgram Nova-2 con WebSocket streaming (PCM linear16, 16kHz, mono)
- Soporte 3 idiomas: Castellano (`es-419`), Inglés (`en-US`), Cast/Ing (`detect_language`)
- Detección automática de preguntas (`is_question` heurística con starters ES + EN)
- Auto-respuesta IA al detectar `speech_final` + pregunta (configurable por sesión)
- Respuesta manual con botón "Pedir respuesta IA"
- RAG pipeline: CV → OpenAI `text-embedding-3-small` (1536 dims) → pgvector → Claude
- Modelos IA seleccionables: Claude Sonnet (recomendado) / Claude Haiku (rápido)
- Panel sesión activa: video del screen share + transcripción en tiempo real + respuestas IA
- Divider arrastrable entre panel de transcripción y panel IA
- Wizard multi-paso para nueva sesión: empresa, puesto, CV, documentos adicionales, idioma, auto-generar, transcripción
- Selector de idioma: Castellano / Inglés / Cast/Ing
- `saveTranscript` configurable por sesión
- Acumulación y guardado de transcripción completa al cerrar sesión

### Fixes
- Autenticación JWT WebSocket: migración de PyJWT → validación via Supabase REST HTTP (`/auth/v1/user`) para soportar ES256
- Resolución `params.id` en Next.js 15 con `React.use()`
- CORS configurado correctamente para el frontend
- Variables de entorno duplicadas en `stt.py` eliminadas

---

## 2026-03-XX — Sprint 3: Desktop Overlay Windows

### Features
- App desktop Tauri v2 (solo Windows win32 x64) — nombre: **ListnrIO**
- Overlay transparente, invisible en screen share (`WDA_EXCLUDEFROMCAPTURE`)
- Flags: `alwaysOnTop`, `skipTaskbar`, `decorations: false`, `transparent: true`
- Mouse passthrough por defecto (`set_ignore_cursor_events`)
- Binary name "pmodule" (Task Manager invisibility)
- Auth deep link `listnr://auth?token=...` — sincroniza sesión web → desktop
- UI completamente en español (regla permanente en CLAUDE.md)
- Transcript strip siempre visible + panel de respuesta IA toggle expand/collapse
- Botón "Respuesta IA" con streaming en tiempo real
- Single-instance plugin — evita múltiples instancias del overlay
- Control de opacidad del overlay
- Pantalla de login con instrucciones para autenticar desde la web

### Fixes
- Deep link single-instance con argv
- Soundwave animado + menú expandido
- Timeout `isRequestingAI` + bloqueo durante streaming
- Indicadores de audio: verde = activo, punto rojo = en curso
- Logo ListnrIO dimensiones correctas en todas las pantallas

---

## 2026-03-18 — Sprint 1-2: Web App base + Auth + CI/CD

### Features

#### Web App (Next.js 14)
- Auth completo: login, registro, callback handler (Google OAuth placeholder)
- Dashboard principal con créditos, plan actual, primeros pasos y botón descarga desktop
- Settings: rol profesional (combobox 30+ roles), nombre, empresa objetivo, idioma de respuestas
- Knowledge: upload CV/PDF/DOCX con indexación vectorial — visualización de fragmentos indexados
- Billing: página de créditos con paquetes y checkout Mercado Pago
- Sessions: historial de sesiones con empresa, puesto, duración, fecha y estado
- Detalle de sesión: resumen + transcripción expandible con scroll
- Middleware de autenticación con `getUser()` en todas las rutas protegidas (nunca `getSession()`)
- Landing page pública con hero, features, plataformas compatibles y CTA
- Botón "Descargar para Windows" en sidebar y dashboard
- `DesktopAuthRedirect` — emite deep link al desktop cuando viene `?desktop_auth=true`

#### Backend (FastAPI Python 3.11)
- `GET /health` · `GET /version`
- `WebSocket /ws/stt` — STT en tiempo real (Deepgram Nova-2) + IA streaming (Claude Sonnet)
- `POST /knowledge/upload` — ingesta de documentos con embeddings OpenAI text-embedding-3-small
- `GET /knowledge/sources` · `DELETE /knowledge/sources/{name}`
- `GET /sessions/balance` · `GET /sessions/` · `POST /sessions/` · `GET /sessions/{id}` · `POST /sessions/{id}/end`
- `GET /sessions/me` — endpoint para desktop (id, email, créditos)
- `POST /payments/create-preference` — preferencia Mercado Pago
- `POST /payments/webhook` — IPN con verificación HMAC-SHA256 e idempotencia
- `GET /payments/packages`
- RAG con pgvector: `match_knowledge()` RPC + cosine similarity (threshold 0.65)
- Créditos atómicos: `deduct_session_credits()` RPC con `FOR UPDATE`

#### Base de datos (Supabase + PostgreSQL 15)
- `user_profiles` — perfil extendido con rol, empresa, idioma, onboarding_step
- `sessions` — sesiones con empresa, puesto, estado, duración, créditos usados, transcript
- `knowledge_chunks` — fragmentos de CV/documentos con embeddings pgvector
- `credit_transactions` — registro de movimientos de créditos
- `user_credits` — vista con balance calculado
- RLS en todas las tablas desde su migración
- Trigger bono de bienvenida (2 créditos al crear perfil)
- Trigger single active session (máximo 1 sesión activa por usuario)

#### Infrastructure
- CI/CD GitHub Actions: frontend (tsc + build) + backend (pytest 80% coverage)
- GitHub Actions build `.exe` NSIS installer en cada tag `v*`
- Deploy: Vercel (web) + Railway (backend)
- Deep-link scheme `listnr://`

### Seguridad
- RLS en todas las tablas Supabase desde su migración
- JWT verificado en cada request via Supabase REST (no PyJWT)
- `WDA_EXCLUDEFROMCAPTURE` — overlay invisible en OBS, Zoom, Teams, Meet
- Webhook Mercado Pago con HMAC-SHA256
- Idempotencia en créditos: verifica `mp_payment_id` antes de acreditar
- `getUser()` en server components (nunca `getSession()`)
- Variables de entorno nunca hardcodeadas

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend web | Next.js 14 · TypeScript strict · Tailwind · shadcn/ui |
| Desktop | Tauri v2 + React · solo Windows win32 x64 |
| Backend | FastAPI Python 3.11 · Railway |
| Auth + DB | Supabase · PostgreSQL 15 + pgvector |
| STT | Deepgram Nova-2 · WebSocket streaming |
| LLM | Claude Sonnet API (`claude-sonnet-4-5`) |
| Embeddings | OpenAI `text-embedding-3-small` · 1536 dims |
| Pagos | Mercado Pago (créditos por sesión) |
| Deploy web | Vercel |
| Deploy backend | Railway |
| CI/CD | GitHub Actions |
