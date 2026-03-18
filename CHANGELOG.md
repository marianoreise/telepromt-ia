# Changelog

## [1.0.0] - 2026-03-18

### ✨ Nuevo

#### Web App (Next.js 14)
- Auth completo: login, registro, OAuth Google, callback handler
- Dashboard con balance de créditos, onboarding y descarga del desktop
- Settings: perfil, nombre, rol, empresa, idioma
- Knowledge: upload de CV/PDF/DOCX con indexación vectorial
- Billing: 3 paquetes de créditos con checkout Mercado Pago (Starter $5 / Pro $10 / Max $20)
- Sessions: historial de sesiones y créditos usados
- Middleware de autenticación con `getUser()` en todas las rutas protegidas

#### Backend (FastAPI Python 3.11)
- `GET /health` · `GET /version`
- `WebSocket /ws/stt` — STT en tiempo real (Deepgram Nova-2) + IA streaming (Claude Sonnet)
- `POST /knowledge/upload` — ingesta de documentos con embeddings OpenAI text-embedding-3-small
- `GET /knowledge/sources` · `DELETE /knowledge/sources/{name}`
- `GET /sessions/balance` · `GET /sessions/`
- `POST /payments/create-preference` — preferencia Mercado Pago
- `POST /payments/webhook` — IPN con verificación HMAC-SHA256 e idempotencia
- `GET /payments/packages`
- RAG con pgvector: `match_knowledge()` RPC + cosine similarity (threshold 0.65)
- Créditos atómicos: `deduct_session_credits()` RPC con `FOR UPDATE`
- 29 tests — 100% en módulos nuevos

#### Desktop App (Tauri v2 + React, Windows x64 only)
- Overlay transparente, invisible en screen share (WDA_EXCLUDEFROMCAPTURE)
- `alwaysOnTop`, `skipTaskbar`, `decorations: false`, `transparent: true`
- Mouse passthrough por defecto (`set_ignore_cursor_events`)
- Binary name "pmodule" (Task Manager invisibility)
- Atajos globales: `Ctrl+Shift+T` / `Ctrl+Shift+M` / `Ctrl+Shift+C`
- WebSocket al backend para transcripción + respuesta IA en streaming
- Control de opacidad con scroll del mouse

#### Infrastructure
- CI/CD GitHub Actions: frontend (tsc + build) + backend (pytest)
- GitHub Actions build `.exe` NSIS installer en cada tag `v*`
- Supabase migrations: `user_profiles`, `credit_transactions`, `knowledge_chunks`, `sessions`, `user_credits`
- Deep-link scheme `telepromt://`
- Deploy: Vercel (web) + Railway (backend)

### 🔒 Seguridad
- RLS en todas las tablas Supabase desde su migración
- JWT verificado en cada request con `SUPABASE_JWT_SECRET`
- WDA_EXCLUDEFROMCAPTURE — invisible en OBS, Zoom, Teams, Meet
- Webhook Mercado Pago con HMAC-SHA256
- Idempotencia en créditos: verifica `mp_payment_id` antes de acreditar
- Headers de seguridad en Vercel (X-Frame-Options, CSP, etc.)
- Pre-deploy check que bloquea credenciales hardcodeadas y `getSession()`
