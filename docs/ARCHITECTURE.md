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

## ADR-003: Modelo de créditos inicial
**Fecha:** 2026-03-18 | **Estado:** Aceptado
**Contexto:** Usuarios nuevos necesitan créditos para probar el producto.
**Decisión:** Al crear perfil, se insertan 2 créditos (= 60 min) como bono de bienvenida vía trigger de Supabase.
**Consecuencias:** Usuario puede probar el producto sin pagar. Saldo visible en dashboard desde el primer login.
