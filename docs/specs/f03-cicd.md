# Feature Spec: CI/CD Pipeline
**ID:** F03 | **Fecha:** 2026-03-18 | **Estado:** Aprobado

## Objetivo
Automatizar lint, tests y deploy en cada push a main, garantizando que producción siempre tenga código verificado.

## User Story
Como developer, quiero que cada push a main ejecute los checks automáticamente y deployé a Vercel y Railway, para no hacer deploys manuales y detectar errores antes de producción.

## Criterios de Aceptación
- [ ] CA-01: GitHub Actions corre en cada push y PR: lint + type-check + tests
- [ ] CA-02: Push a main deployea frontend a Vercel automáticamente
- [ ] CA-03: Push a main deployea backend a Railway automáticamente
- [ ] CA-04: CI falla si hay errores TypeScript o tests que no pasan
- [ ] CA-05: Variables de entorno configuradas en Vercel y Railway

## Fuera de scope
- Deploy a staging separado
- Notificaciones Slack

## Notas para el architect
- GitHub Actions con jobs paralelos: frontend + backend
- Secrets en GitHub: VERCEL_TOKEN, RAILWAY_TOKEN, SUPABASE_* etc.
- Vercel deployea automáticamente desde GitHub (integración nativa)
- Railway: usar railway.toml para config del servicio

## Métricas de éxito en producción
- CI corre en < 5 minutos
- 0 deploys manuales necesarios
