# Architecture — Telepromt IA

## ADR-001: Stack de autenticación
**Fecha:** 2026-03-18 | **Estado:** Aceptado
**Contexto:** Necesitamos auth segura con SSR, OAuth y JWT verificable en FastAPI.
**Decisión:** Supabase Auth con @supabase/ssr. getUser() en server, nunca getSession(). JWT verificado con PyJWT en FastAPI usando SUPABASE_JWT_SECRET.
**Alternativas descartadas:** NextAuth (más complejidad, duplica auth); Auth0 (costo, vendor lock-in).
**Consecuencias:** Sesiones server-side correctas; JWT verificable sin llamada extra a Supabase desde backend.

## ADR-002: Estructura de la web app
**Fecha:** 2026-03-18 | **Estado:** Aceptado
**Contexto:** Next.js 14 App Router con grupos de rutas para auth y dashboard.
**Decisión:** Route groups (auth) y (dashboard). Layout de dashboard con sidebar. Server Components por defecto, 'use client' solo donde necesario.
**Consecuencias:** Menor JS en cliente; mejor SEO; lógica de auth centralizada en middleware.

## ADR-004: Desktop overlay Windows con Tauri v2
**Fecha:** 2026-03-18 | **Estado:** Aceptado
**Contexto:** Necesitamos una ventana overlay transparente e invisible en screen share para Windows.
**Decisión:** Tauri v2 + React. SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE) via crate `windows` en Rust. skipTaskbar en tauri.conf.json. Proceso nombrado 'pmodule' via nombre del binario en Cargo.toml.
**Alternativas descartadas:** Electron (binario 150MB+, no tiene acceso directo a WASAPI); WPF (no React, sin ecosystem web).
**Consecuencias:** Binario ~15MB. Solo Windows win32 x64. NUNCA generar código macOS/CoreAudio/DMG.

## ADR-003: Modelo de créditos inicial
**Fecha:** 2026-03-18 | **Estado:** Aceptado
**Contexto:** Usuarios nuevos necesitan créditos para probar el producto.
**Decisión:** Al crear perfil, se insertan 2 créditos (= 60 min) como bono de bienvenida vía trigger de Supabase.
**Consecuencias:** Usuario puede probar el producto sin pagar. Saldo visible en dashboard desde el primer login.

## ADR-005: Ciclo de vida de sesión gratuita con expiración lazy
**Fecha:** 2026-03-19 | **Estado:** Aceptado
**Contexto:** Las sesiones gratuitas duran 10 minutos (600 s). Necesitamos detectar expiración sin jobs en background ni cron, dado que Railway en plan Starter no garantiza procesos persistentes.
**Decisión:** Expiración lazy en el servidor — `GET /sessions/{id}` calcula `elapsed = now - started_at`; si elapsed >= 600 s y status == 'active', hace UPDATE a 'expired' en esa misma request. El frontend mantiene un countdown local (`useSessionTimer`) que es puramente cosmético y no dispara llamadas al backend. El constraint de una sola sesión activa se refuerza a nivel de trigger PostgreSQL (`trg_single_active_session`) para evitar races entre pestañas o dispositivos. La columna `status` acepta: active, ended, expired.
**Alternativas descartadas:** Cron job / pg_cron (requiere extensión en Supabase pro y añade complejidad operativa); WebSocket heartbeat con timeout (overhead de conexión para una feature de billing simple); expiración solo en cliente (inseguro, manipulable).
**Consecuencias:** Una sesión puede quedar técnicamente activa en DB algunos minutos extra si el usuario nunca vuelve a consultarla — esto es aceptable porque credits_used = 0 en sesión gratuita. Para sesiones de pago (Sprint 6), se revisará si se necesita expiración proactiva. El frontend debe tolerar que el backend cambie el status en cualquier GET.
