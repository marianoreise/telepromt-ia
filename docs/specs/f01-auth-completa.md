# Feature Spec: Auth Completa
**ID:** F01 | **Fecha:** 2026-03-18 | **Estado:** Aprobado

## Objetivo
Permitir que los usuarios creen cuenta e inicien sesión en Telepromt IA de forma segura, con acceso protegido al dashboard.

## User Story
Como usuario nuevo, quiero registrarme y hacer login con email/contraseña o Google, para acceder a mi cuenta y comenzar a usar el asistente.

## Criterios de Aceptación
- [ ] CA-01: Registro con email + contraseña funciona y envía email de verificación
- [ ] CA-02: Login con email + contraseña funciona y redirige al dashboard
- [ ] CA-03: Login con Google OAuth funciona (un click)
- [ ] CA-04: Rutas /dashboard/** redirigen a /login si no hay sesión activa
- [ ] CA-05: Rutas /login y /register redirigen a /dashboard si ya hay sesión
- [ ] CA-06: JWT del usuario es verificado en cada API route de Next.js usando getUser()
- [ ] CA-07: Todas las tablas con user_id tienen RLS habilitado
- [ ] CA-08: El middleware de FastAPI verifica el JWT en todos los endpoints protegidos

## Fuera de scope
- Login con GitHub, Twitter u otros OAuth providers
- 2FA / MFA
- SSO empresarial

## Notas para el architect
- Usar Supabase Auth con @supabase/ssr para SSR/SSG correcto
- JWT secret en SUPABASE_JWT_SECRET (env var, nunca hardcodeado)
- Siempre getUser() en API routes — NUNCA getSession()
- Middleware Next.js debe correr en Edge Runtime

## Métricas de éxito en producción
- 0 errores 401 en usuarios autenticados
- Tiempo de login < 2 segundos
