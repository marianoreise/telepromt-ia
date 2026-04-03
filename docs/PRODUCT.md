# listnr.io — Documentación de Producto Completa

> **Para agentes Claude:** Este archivo describe el estado actual del producto en producción.
> Es la fuente de verdad de funcionalidad, flujos y arquitectura sin necesidad de leer el código.
> Estado al: **2026-04-02**. URLs de producción: web → `https://telepromt-ia.vercel.app` · backend → `https://backend-production-c314.up.railway.app`

---

## 1. ¿Qué es listnr.io?

Asistente IA en tiempo real para videollamadas y entrevistas de trabajo. Escucha el audio del sistema, transcribe en tiempo real con Deepgram, detecta preguntas del entrevistador y muestra respuestas IA como teleprompter — completamente invisible para los demás participantes.

**Usuarios objetivo:** profesionales en entrevistas de trabajo (especialmente en inglés o mixtas castellano/inglés).

---

## 2. Superficies del producto

| Superficie | Tecnología | URL / Distribución |
|---|---|---|
| Web App | Next.js 14 + TypeScript | `https://telepromt-ia.vercel.app` |
| Backend API | FastAPI Python 3.11 | `https://backend-production-c314.up.railway.app` |
| Desktop Overlay | Tauri v2 + React (solo Windows win32 x64) | Instalador `.exe` (GitHub Releases) |
| Base de datos | Supabase + PostgreSQL 15 + pgvector | Proyecto `wkpkgvcfkfiqykkicjob` |

---

## 3. Stack técnico completo

| Capa | Tecnología | Detalles |
|---|---|---|
| Frontend web | Next.js 14 · TypeScript strict · Tailwind CSS · shadcn/ui | App Router, Server Components por defecto |
| Desktop | Tauri v2 + React · solo Windows win32 x64 | Nombre de app: **ListnrIO** |
| Backend | FastAPI Python 3.11 | Railway, puerto 8000 |
| Auth + DB | Supabase · PostgreSQL 15 + pgvector + Auth | RLS en todas las tablas |
| STT | Deepgram Nova-2 · WebSocket streaming | PCM linear16, 16kHz, mono |
| LLM | Claude Sonnet API (`claude-sonnet-4-5`) | Streaming via Anthropic SDK |
| Embeddings | OpenAI `text-embedding-3-small` · 1536 dims | Para indexación RAG del CV |
| Web search | Tavily API | Reservado, no activo aún |
| Pagos | Mercado Pago (créditos por sesión) | IPN webhook con HMAC-SHA256 |
| Deploy web | Vercel | CI/CD automático en push a `main` |
| Deploy backend | Railway | Auto-deploy desde `main` |
| CI/CD | GitHub Actions | tsc + build (frontend) · pytest 80% (backend) |

---

## 4. Modelo de negocio

### Créditos

- **Plan Gratuito:** sesiones de hasta 10 minutos sin costo (sin créditos necesarios). Watchdog en backend corta la sesión al llegar al límite.
- **Plan Pago:** 0.5 créditos / 30 minutos de sesión activa (billing tracker en backend descuenta cada 30 min).
- **Bono de bienvenida:** 2 créditos (= 60 minutos) se acreditan automáticamente al crear el perfil vía trigger SQL en Supabase.
- 1 crédito = 30 minutos de sesión activa.

### Paquetes de créditos (Mercado Pago, precios en ARS)

| ID | Nombre | Créditos | Precio ARS | Minutos |
|---|---|---|---|---|
| `starter` | Starter | 10 | $10.000 | 300 min (5h) |
| `pro` | Pro | 25 | $20.000 | 750 min (12.5h) |
| `max` | Max | 60 | $55.000 | 1800 min (30h) |

---

## 5. Autenticación

### Flujo web
1. Usuario accede a `listnr.io` → redirige a `/login` si no está autenticado.
2. Login con email/password via Supabase Auth.
3. Google OAuth disponible (placeholder implementado, no activado).
4. Middleware Next.js llama `getUser()` en todas las rutas protegidas — nunca `getSession()`.
5. Server Components usan `createClient()` de `@/lib/supabase/server`.

### Flujo desktop (sincronización web → desktop)
1. Usuario abre la app desktop → muestra pantalla de login con instrucciones.
2. Usuario abre `listnr.io` en el navegador y hace login.
3. Al detectar `?desktop_auth=true` en la URL, la web emite un deep link: `listnr://auth?token=ACCESS_TOKEN&refresh_token=REFRESH_TOKEN`.
4. La app desktop captura el deep link (single-instance plugin) y queda autenticada.
5. Sin sesión web activa, el desktop solo muestra la pantalla de login.

### Auth en el backend (FastAPI)
- Cada request lleva `Authorization: Bearer <supabase_jwt>`.
- El middleware `auth.py` valida el JWT llamando a `GET /auth/v1/user` de Supabase REST (no usa PyJWT — evita problemas con ES256).
- El WebSocket STT valida el token en el primer mensaje JSON del handshake, usando el mismo endpoint REST vía `httpx` async.

---

## 6. Base de datos (Supabase PostgreSQL 15)

### Tablas

#### `user_profiles`
Perfil extendido del usuario (one-to-one con `auth.users`).

| Columna | Tipo | Descripción |
|---|---|---|
| `user_id` | uuid (PK, FK auth.users) | Identificador del usuario |
| `display_name` | text | Nombre para mostrar |
| `role` | text | Rol profesional (ej: "Software Engineer") |
| `target_company` | text | Empresa objetivo (opcional) |
| `preferred_language` | text | Idioma de respuestas (`es`, `en`, `es-en`) |
| `onboarding_step` | int | Legado — ya no se usa para el onboarding |
| `created_at` | timestamptz | — |

Trigger: al insertar nuevo perfil → inserta 2 créditos en `credit_transactions` (bono bienvenida).

#### `sessions`
Sesiones de entrevista.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | — |
| `user_id` | uuid (FK) | — |
| `company` | text | Empresa de la entrevista |
| `job_title` | text | Puesto al que aplica |
| `status` | text | `active` / `ended` / `expired` |
| `started_at` | timestamptz | — |
| `ended_at` | timestamptz | null si sigue activa |
| `duration_sec` | int | Duración total en segundos |
| `credits_used` | numeric | Créditos consumidos en la sesión |
| `transcript` | text | Transcripción completa acumulada (nullable) |

Trigger: máximo 1 sesión activa por usuario (block al crear si ya hay una).

#### `knowledge_chunks`
Fragmentos del CV/documentos indexados con pgvector.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | — |
| `user_id` | uuid (FK) | — |
| `source_name` | text | Nombre del archivo original |
| `content` | text | Texto del fragmento |
| `embedding` | vector(1536) | Embedding OpenAI text-embedding-3-small |
| `created_at` | timestamptz | — |

#### `credit_transactions`
Registro de todos los movimientos de créditos.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK) | — |
| `user_id` | uuid (FK) | — |
| `amount` | numeric | Positivo = compra/bono. Negativo = consumo |
| `type` | text | `purchase` / `usage` / `bonus` |
| `description` | text | Descripción legible |
| `mp_payment_id` | text | ID pago Mercado Pago (para idempotencia) |
| `created_at` | timestamptz | — |

#### `user_credits` (vista)
Vista calculada: `SUM(amount)` de `credit_transactions` agrupado por `user_id`. Columna expuesta: `balance`.

### Funciones SQL

- **`match_knowledge(query_embedding, match_user_id, match_count, similarity_threshold)`** → RPC para búsqueda vectorial por similitud coseno. Threshold: 0.65. Top-K: 4.
- **`deduct_session_credits(user_id, amount)`** → descuento atómico con `FOR UPDATE` (evita race conditions en billing).

### Seguridad
- RLS habilitado en todas las tablas desde su migración.
- `GRANT ALL ON user_profiles TO authenticated` (ejecutado para habilitar escritura).
- `service_role` policies en `user_credits` y `credit_transactions` para que el backend pueda escribir sin pasar por RLS del usuario.

---

## 7. API del Backend (FastAPI)

Base URL: `https://backend-production-c314.up.railway.app`

### Autenticación en requests HTTP
Todos los endpoints (excepto `/health`, `/version`, `/payments/webhook`, `/payments/packages`) requieren:
```
Authorization: Bearer <supabase_jwt>
```

### Endpoints

#### Health
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | No | Estado del servidor. Returns `{"status": "ok"}` |
| GET | `/version` | No | Versión desplegada |

#### Sesiones
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/sessions/me` | Sí | `{id, email, credits}` — usado por el desktop |
| GET | `/sessions/balance` | Sí | `{balance, used_all_time}` |
| GET | `/sessions/` | Sí | Lista últimas 5 sesiones del usuario |
| POST | `/sessions/` | Sí | Crea nueva sesión `{company, job_title}` → retorna `SessionDetail` con `seconds_remaining: 600` |
| GET | `/sessions/{id}` | Sí | Detalle de sesión incluyendo `transcript` |
| POST | `/sessions/{id}/end` | Sí | Cierra sesión activa manualmente |

#### Knowledge (Base de conocimiento)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/knowledge/upload` | Sí | Sube PDF/DOCX/TXT (máx 5MB) → extrae texto → chunking → embeddings OpenAI → inserta en pgvector |
| GET | `/knowledge/sources` | Sí | Lista documentos indexados con chunk count |
| DELETE | `/knowledge/sources/{source_name}` | Sí | Elimina todos los chunks de un documento |

#### Pagos (Mercado Pago)
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/payments/create-preference` | Sí | Crea preferencia MP `{package_id}` → retorna `{preference_id, init_point, sandbox_init_point}` |
| POST | `/payments/webhook` | No | IPN de Mercado Pago — verifica HMAC-SHA256, acredita créditos con idempotencia |
| GET | `/payments/packages` | No | Lista paquetes disponibles con precios |

#### WebSocket STT
| Protocolo | Ruta | Descripción |
|---|---|---|
| WebSocket | `/ws/stt` | STT en tiempo real + IA contextual |

---

## 8. WebSocket STT — Protocolo completo

### Conexión
`wss://backend-production-c314.up.railway.app/ws/stt`

### Flujo de mensajes

#### Cliente → Servidor

**Mensaje 1 (handshake JSON — obligatorio):**
```json
{
  "token": "<supabase_jwt>",
  "language": "es" | "en" | "es-en",
  "session_id": "<uuid de la sesión en DB>",
  "company": "Nombre de la empresa",
  "job_title": "Puesto al que aplica",
  "extra_context": "Instrucciones adicionales para la IA",
  "ai_model": "claude-sonnet-4-5" | "claude-haiku-4-5-20251001",
  "auto_generate": true | false
}
```

**Mensajes subsiguientes:**
- **Bytes (PCM):** audio crudo, linear16, 16kHz, mono — enviado continuamente desde el micrófono/WASAPI.
- **Text `"stop"`:** cierre graceful de la sesión.
- **JSON `{"type": "request_ai"}`:** solicita respuesta IA manual con el último transcript final disponible.

#### Servidor → Cliente

| Tipo | Payload | Descripción |
|---|---|---|
| `connected` | `{session_id, balance}` | Handshake OK. `session_id` es el UUID local (no el de DB). `balance` en créditos. |
| `transcript` | `{text, is_final}` | Fragmento de transcripción. `is_final: true` cuando Deepgram cierra el utterance. |
| `ai_start` | `{question}` | IA comenzó a generar. `question` es la pregunta detectada. |
| `ai_chunk` | `{chunk}` | Token de respuesta IA en streaming. |
| `ai_done` | `{}` | IA terminó de responder. |
| `warn` | `{seconds_remaining}` | Advertencia de créditos o tiempo libre agotándose. |
| `out_of_credits` | `{}` | Sin créditos — conexión cerrará. |
| `error` | `{message}` | Error del servidor. |

### Lógica interna del backend

1. **Auth:** verifica JWT contra Supabase REST `/auth/v1/user` (async, httpx).
2. **Idioma:** usa `language` del handshake, o fetch de `preferred_language` del perfil si no se especificó.
3. **Deepgram:** según idioma:
   - `es` → `language: es-419` (español latinoamericano)
   - `en` → `language: en-US`
   - `es-en` → `detect_language: true` (bilingüe automático)
4. **Billing tracker:** arranca al conectar, descuenta 0.5 créditos cada 30 min si hay balance.
5. **Free watchdog:** si balance == 0, corta la sesión a los 10 minutos (avisa a los 9:30).
6. **Detección de preguntas (`is_question`):** heurística con signos de interrogación + starters en ES y EN.
7. **Auto-respuesta IA:** si `auto_generate: true` y el transcript `speech_final` es una pregunta → dispara respuesta IA automáticamente.
8. **RAG:** antes de llamar a Claude, embebe la pregunta con OpenAI y busca los 4 chunks más similares del CV del usuario (threshold 0.65). Si no hay contexto, responde sin él.
9. **Guardado de transcripción:** al cerrar la sesión (`finally`), hace PATCH via httpx directo a Supabase REST API con la transcripción acumulada (evita 403 del SDK con RLS).

---

## 9. Pipeline RAG (Retrieval-Augmented Generation)

```
Documento (PDF/DOCX/TXT)
    ↓ extracción de texto (pdfplumber / mammoth)
    ↓ chunking (text_utils.py)
    ↓ embedding OpenAI text-embedding-3-small (1536 dims)
    ↓ storage en knowledge_chunks (pgvector)

Pregunta detectada en entrevista
    ↓ embedding de la pregunta
    ↓ match_knowledge RPC (cosine similarity, threshold 0.65, top 4)
    ↓ contexto relevante del CV (máx 3000 chars)
    ↓ Claude (system prompt + pregunta + contexto)
    ↓ respuesta en primera persona como el candidato (streaming)
```

**Modelos seleccionables por el usuario en el wizard:**
- Claude Sonnet (`claude-sonnet-4-5`) — recomendado, mejor calidad
- Claude Haiku (`claude-haiku-4-5-20251001`) — más rápido, menor costo

**System prompt:** primera persona como candidato. Nunca menciona que es IA. Responde en el idioma de la pregunta. Máximo 3-4 oraciones. Sin markdown. Personalizado con empresa, puesto e instrucciones extra del usuario.

---

## 10. Web App — Pantallas y funcionalidad

### Rutas públicas
- `/` — Landing page con hero, features, plataformas compatibles (Google Meet, Zoom, Teams, WebEx, Slack) y CTA.
- `/login` — Login con email/password.
- `/register` — Registro de nueva cuenta.
- `/auth/callback` — Callback OAuth.

### Rutas protegidas (requieren auth)

#### `/dashboard`
- Muestra nombre del usuario (de `display_name` del perfil, fallback a email).
- **Card "Créditos disponibles":** balance actual + minutos restantes (1 crédito = 30 min).
- **Card "Plan actual":** badge "Gratuito" + botón "Comprar créditos" → `/billing`.
- **Card "Sesiones":** botón "Nueva sesión" → `/sessions`.
- **Onboarding "Primeros pasos":** checklist de 3 pasos basados en **datos reales**:
  1. Completar perfil — `done` si `display_name` y `role` están completados.
  2. Subir CV / Resume — `done` si hay al menos 1 chunk en `knowledge_chunks`.
  3. Sesiones realizadas — `done` si hay al menos 1 sesión en `sessions`.
- El onboarding desaparece cuando los 3 pasos están completos.

#### `/settings`
- Formulario de configuración del perfil:
  - Nombre (`display_name`)
  - Rol profesional (`role`) — combobox con 30+ roles en categorías + "Otro" con campo de texto libre
  - Empresa objetivo (`target_company`) — campo de texto libre
  - Idioma de respuestas (`preferred_language`) — Castellano / Inglés / Cast/Ing
- Guarda en `user_profiles` vía Supabase client.
- No tiene título/encabezado dentro del card — los campos están directamente.

#### `/knowledge`
- Lista de documentos indexados (nombre, cantidad de chunks, fecha).
- Botón de subida de archivo (PDF, DOCX, TXT — máx 5 MB).
- Al subir: llama a `POST /knowledge/upload` → chunking + embeddings.
- Botón de eliminación por documento.

#### `/sessions`
- Lista de últimas 5 sesiones (empresa, puesto, duración, créditos usados, estado, fecha).
- Botón "Nueva sesión" → abre el wizard modal.
- Click en sesión → `/sessions/[id]`.

#### `/sessions/[id]`
Esta es la pantalla principal de la experiencia de entrevista. Tiene dos estados:

**Estado ACTIVO (sesión en curso):**
- Panel izquierdo: transcripción en tiempo real con scroll automático.
- Panel derecho: respuestas IA.
  - Cada entrada muestra:
    - **PREGUNTA** (en azul `#1B6CA8`): la pregunta detectada del entrevistador.
    - **RESPUESTA** (en violeta `#7B35A2`): la respuesta IA generada.
  - Botón flotante "Pedir respuesta IA" (solicita respuesta manual).
  - `pb-16` en el scroll para que el botón flotante no tape el contenido.
- Divider arrastrable entre paneles.
- Botón "Finalizar sesión".

**Estado FINALIZADO/EXPIRADO (`EndedSessionView`):**
- Muestra empresa y puesto de la sesión.
- Siempre visibles dos botones:
  - **"Mis sesiones"** (outline) → vuelve a `/sessions`.
  - **"Transcripción"** (gradient) → habilitado solo si hay transcript. Muestra/oculta la transcripción completa.
- Transcripción: líneas filtradas (sin líneas vacías) + scroll con `pb-2`.

#### `/billing`
- 3 paquetes de créditos: Starter / Pro / Max con precios en ARS.
- Botón de compra → llama a `POST /payments/create-preference` → redirige a Mercado Pago.
- Al volver de MP: query param `?status=success|failure|pending` → muestra mensaje correspondiente.

---

## 11. Wizard "Nueva Sesión" (6 pasos)

El wizard es un modal multi-paso que guía al usuario antes de iniciar una sesión.

| Paso | Contenido |
|---|---|
| 1 | Conexión de audio — instrucciones para compartir audio del sistema en Google Meet/Zoom/Teams/WebEx/Slack (logos SVG oficiales con colores de marca) |
| 2 | Empresa — campo de texto para ingresar la empresa de la entrevista |
| 3 | Puesto — `RoleCombobox` con 30+ roles en categorías + buscador + "Otro" con campo de texto |
| 4 | Idioma — Castellano / Inglés / Cast/Ing |
| 5 | Configuración IA — toggle auto-generar, selector modelo (Sonnet recomendado / Haiku rápido), instrucciones extra |
| 6 | Guardar transcripción — toggle para habilitar el guardado de la transcripción de la sesión |

Al completar: crea la sesión en DB (`POST /sessions/`) → abre `/sessions/[id]`.

---

## 12. Desktop App (Tauri v2 — Windows)

### Características técnicas
- **Nombre de la app:** ListnrIO
- **Binario:** `pmodule` (invisibilidad en Task Manager)
- **Solo Windows win32 x64**
- Overlay transparente e invisible en screen share: `WDA_EXCLUDEFROMCAPTURE`
- `alwaysOnTop`, `skipTaskbar`, `decorations: false`, `transparent: true`
- Mouse passthrough por defecto (`set_ignore_cursor_events`)
- Single-instance plugin (evita múltiples instancias)
- Deep link scheme `listnr://`

### Pantallas del overlay
1. **Pantalla de login:** instrucciones para autenticar desde la web. Muestra QR/enlace a listnr.io.
2. **Pantalla activa:** strip de transcripción + panel IA (expandible/colapsable con toggle) + control de opacidad.

### Flujo de audio WASAPI
- Captura audio del sistema (loopback) con WASAPI en Windows.
- Envía PCM raw al backend vía WebSocket (linear16, 16kHz, mono).

---

## 13. Seguridad

| Capa | Mecanismo |
|---|---|
| Auth web | `getUser()` en server components — nunca `getSession()` |
| Auth backend | JWT verificado vía Supabase REST en cada request |
| Auth WebSocket | JWT validado en handshake vía httpx async a Supabase REST |
| DB | RLS habilitado en todas las tablas desde creación |
| Pagos | HMAC-SHA256 en webhook Mercado Pago |
| Idempotencia | Verifica `mp_payment_id` antes de acreditar créditos |
| Overlay invisibilidad | `WDA_EXCLUDEFROMCAPTURE` — invisible en OBS, Zoom, Teams, Meet |
| Env vars | Nunca hardcodeadas — siempre `process.env` / `os.environ` |

---

## 14. CI/CD e infraestructura

| Componente | Configuración |
|---|---|
| Frontend | Vercel — auto-deploy en push a `main` |
| Backend | Railway — auto-deploy en push a `main` |
| CI Frontend | GitHub Actions: `tsc --noEmit` + `next build` |
| CI Backend | GitHub Actions: `pytest` con cobertura mínima 80% |
| Desktop build | GitHub Actions en tags `v*` → genera `.exe` con NSIS installer |
| Deep link | Scheme `listnr://` registrado en Windows al instalar |

---

## 15. Deuda técnica conocida (post 2026-04-02)

### Crítica
- **C1:** `RoleCombobox` usa inline styles en lugar de Tailwind — sin focus ring, hover via JS. Reescribir con `Popover`/`Command` de shadcn.
- **C2:** Toggle del wizard usa `bg-blue-600` en lugar de `#1B6CA8`. Sin focus ring WCAG.
- **C-1 UX:** Sin validación cuando usuario elige "Otro" en campo Puesto y deja el input vacío.

### Importantes
- **I1:** Step indicator del wizard usa `bg-blue-500` en lugar de `#1B6CA8`.
- **I2:** Selector modelo IA con clases `blue-X` inconsistentes.
- **I3:** Botón flotante IA puede tapar contenido en panel derecho — agregar `relative` al contenedor padre de `ActiveSessionView`.
- **C-3 UX:** Transcripción en sesión activa no distingue hablantes (Entrevistador vs Candidato) — requiere campo `speaker` en `TranscriptEntry`.

---

## 16. Variables de entorno requeridas

### Backend (Railway)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
DEEPGRAM_API_KEY
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
FRONTEND_URL
BACKEND_URL
```

### Frontend (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_BACKEND_URL
```

---

## 17. Flujo completo de una sesión de entrevista

```
Usuario en listnr.io (web o desktop)
    ↓
1. Abre wizard "Nueva sesión"
2. Configura empresa, puesto, idioma, modelo IA, auto-generar
3. POST /sessions/ → crea sesión en DB → obtiene session_id real
4. Navega a /sessions/[id] → inicia captura de audio
5. WebSocket connect → handshake con token + toda la config de sesión
6. Backend: auth OK → Deepgram session start → billing tracker start
    ↓
   DURANTE LA SESIÓN:
7. Audio PCM → Deepgram → transcript → frontend (tiempo real)
8. speech_final + is_question? → auto-respuesta IA (si auto_generate)
9. IA: embed pregunta → RAG en CV → Claude streaming → ai_chunks → frontend
10. Frontend muestra PREGUNTA + RESPUESTA en panel derecho
11. Billing: cada 30 min descuenta 0.5 créditos (si tiene balance)
12. Free users: watchdog corta a los 10 min
    ↓
13. Usuario presiona "Finalizar sesión" → WS "stop" → backend finally:
    - Guarda transcripción completa via httpx PATCH a Supabase REST
    - Para Deepgram, billing tracker, tasks
14. POST /sessions/{id}/end → actualiza status, duration, credits_used en DB
15. EndedSessionView → botones "Mis sesiones" y "Transcripción"
```

---

*Documento generado el 2026-04-02. Actualizar al cierre de cada sprint o ante cambios arquitecturales significativos.*
