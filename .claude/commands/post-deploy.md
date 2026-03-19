---
description: Valida que producción está sana después de un deploy. Usar 3-5 minutos después de que el CI/CD termina. Incluye validación técnica, UX y visual.
---
# /post-deploy (smoke test)

Ejecutar los 3 pasos en paralelo y luego consolidar resultados.

## Paso 1 — Validación técnica
Invocar `deploy-validator` con:
- Frontend URL: `https://telepromt-ia.vercel.app`
- Backend URL: `https://backend-production-c314.up.railway.app`

Verifica: HTTP 200 en rutas clave, autenticación redirige, backend /health OK, rutas OpenAPI presentes.

## Paso 2 — Revisión UX
Invocar `ux-reviewer` para evaluar las pantallas afectadas por el deploy:
- Leer los archivos modificados en el último commit (`git diff HEAD~1 --name-only`)
- Evaluar cada pantalla con interfaz visual usando los 10 principios de Nielsen
- Detectar regresiones visuales o de usabilidad introducidas por los cambios
- Entregar reporte con problemas 🔴🟠🟡 y veredicto APROBADO / NECESITA MEJORAS

## Paso 3 — Revisión visual
Invocar `ui-designer` para verificar consistencia visual:
- Revisar que los componentes modificados sigan el sistema de diseño de listnr.io
- Verificar colores, tipografía, espaciados y estados interactivos
- Detectar inconsistencias entre la web app y el overlay desktop si aplica
- Entregar lista de inconsistencias visuales ordenadas por severidad

## Paso 4 — Reporte consolidado

| Check | Agente | Estado | Detalle |
|---|---|---|---|
| Técnico (HTTP/API) | deploy-validator | ✅/❌ | Rutas verificadas |
| UX | ux-reviewer | ✅/❌ | Veredicto + issues |
| Visual | ui-designer | ✅/❌ | Inconsistencias |

**Veredicto final:**
- Todos verdes → `✅ PRODUCCIÓN SANA — release cerrado`
- UX/visual con issues menores (🟡) → `⚠️ SANO CON DEUDA — crear tareas de mejora`
- Técnico rojo o UX/visual 🔴 → `❌ PROBLEMAS — invocar release-manager para rollback`

## Paso 5 — Consumo de tokens de la sesión

Al final del reporte SIEMPRE incluir:

```
## Consumo de tokens — sesión
| Concepto | Tokens |
|---|---|
| Agentes lanzados | N |
| Tokens totales (aprox) | ~XXX,XXX |
```

Los tokens se suman de los campos `total_tokens` reportados por cada agente lanzado durante la sesión de trabajo. Si no hay datos exactos disponibles, indicar "no disponible" pero la sección SIEMPRE debe aparecer.
