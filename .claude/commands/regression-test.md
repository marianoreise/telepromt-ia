---
description: Ejecuta suite de regresión completa antes de commitear. Tests frontend + backend con coverage, build de producción y pre-deploy check. NO commitear si algo falla.
---
# /regression-test

Ejecutá cada paso en orden. Si alguno falla → DETENER y reportar antes de continuar.

## Paso 1 — Tests unitarios frontend con coverage
```bash
cd apps/web && npm test -- --coverage --reporter=verbose 2>&1 | tail -30
```
**Criterio:** todos los tests pasan · coverage >= 80% en módulos modificados.
Si falla → invocar `testing-specialist` para diagnóstico y fix.

## Paso 2 — Tests unitarios backend con coverage
```bash
cd backend && python -m pytest tests/ --cov=. --cov-report=term-missing -v --tb=short 2>&1 | tail -30
```
**Criterio:** todos los tests pasan · coverage >= 80% en módulos modificados.
Si falla → invocar `testing-specialist` para diagnóstico y fix.

## Paso 3 — Build de producción Next.js
```bash
cd apps/web && NEXT_PUBLIC_SUPABASE_URL=https://wkpkgvcfkfiqykkicjob.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcGtndmNma2ZpcXlra2ljam9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTQyNjgsImV4cCI6MjA4OTQzMDI2OH0.pDLmUYKm79bg1hG7r57N2s7X0e00GPNRkSFvcMZfFsA \
  NEXT_PUBLIC_APP_URL=https://telepromt-ia.vercel.app \
  NEXT_PUBLIC_API_URL=https://backend-production-c314.up.railway.app \
  npm run build 2>&1 | grep -E "error|Error|Failed|✓|Route" | grep -v node_modules | tail -20
```
**Criterio:** build finaliza sin errores de compilación.
Si falla → DETENER. Revisar errores de TypeScript o imports.

## Paso 4 — Pre-deploy check
```bash
bash scripts/pre-deploy-check.sh 2>&1
```
Exit 0 → OK. Exit 1 → advertencias, revisar con humano. Exit 2 → DETENER.
Si el script no existe → saltar este paso e indicarlo en el reporte.

## Paso 5 — Reporte final
Mostrar tabla resumen con el estado de cada paso:

| Paso | Descripción | Estado | Detalle |
|------|-------------|--------|---------|
| 1 | Tests frontend | ✅/❌ | N tests · coverage X% |
| 2 | Tests backend | ✅/❌ | N tests · coverage X% |
| 3 | Build Next.js | ✅/❌ | Duración / error |
| 4 | Pre-deploy check | ✅/❌/⏭️ | Exit code / skipped |

**Veredicto final:**
- Todos verdes → `✅ LISTO PARA COMMITEAR`
- Alguno rojo → `❌ NO COMMITEAR — arreglar primero: [lista de problemas]`
