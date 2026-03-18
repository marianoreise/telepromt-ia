# Feature Spec: Dashboard Base
**ID:** F02 | **Fecha:** 2026-03-18 | **Estado:** Aprobado

## Objetivo
Proveer al usuario autenticado un dashboard central donde vea su saldo de créditos, complete el onboarding inicial y descargue el cliente desktop.

## User Story
Como usuario autenticado, quiero ver mi dashboard con saldo de créditos y un link para descargar la app desktop, para empezar a usar Telepromt IA en mis videollamadas.

## Criterios de Aceptación
- [ ] CA-01: Dashboard muestra nombre del usuario y saldo de créditos actual
- [ ] CA-02: Onboarding de 3 pasos: completar perfil → subir CV → descargar desktop
- [ ] CA-03: Banner/botón de descarga del instalador Windows (.exe) — placeholder por ahora
- [ ] CA-04: Sidebar con navegación: Dashboard · Knowledge · Sessions · Settings · Billing
- [ ] CA-05: Perfil editable: nombre, rol profesional, empresa objetivo, idioma preferido
- [ ] CA-06: Skeleton loaders mientras cargan los datos
- [ ] CA-07: Mobile-responsive

## Fuera de scope
- Historial de sesiones (Sprint 4-5)
- Billing real con Mercado Pago (Sprint 6)
- Upload de CV funcional (Sprint 4-5)

## Notas para el architect
- Tabla user_profiles con campos: display_name, role, target_company, preferred_language
- Tabla credit_transactions para el saldo (iniciar con 60 min gratis = 2 créditos)
- Server Components para el layout, Client Components solo donde haya interactividad

## Métricas de éxito en producción
- Dashboard carga en < 1.5 segundos
- 0 errores de hidratación en consola
