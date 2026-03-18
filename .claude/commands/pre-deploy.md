---
description: Pipeline completo de verificación antes de mergear a main. Ejecuta tests + build + security + validación final. Bloquea si algo falla.
---
# /pre-deploy

## Paso 1 — Script de pre-deploy
```bash
bash scripts/pre-deploy-check.sh
```
Exit 2 → DETENER. Exit 1 → revisar con humano. Exit 0 → continuar.

## Paso 2 — Tests completos
```bash
cd apps/web && npm test -- --coverage --reporter=verbose 2>&1 | tail -20
cd backend && python -m pytest tests/ --cov=. -v --tb=short 2>&1 | tail -20
```
Si cualquier test falla → DETENER. Invocar `testing-specialist`.

## Paso 3 — Build de producción
```bash
cd apps/web && npm run build 2>&1 | grep -E "error|Error" | grep -v node_modules
```
Si hay errores → DETENER.

## Paso 4 — Security audit
Invocar `security-specialist`. Si devuelve BLOQUEADO → DETENER.

## Paso 5 — Code review del diff
```bash
git diff main..HEAD --stat && git log main..HEAD --oneline
```
Invocar `reviewer` con el diff completo.

## Paso 6 — Validación final
Invocar `judge` con criterios:
- Tests pasan · Coverage >= 80% · Build limpio · Sin secretos · Sin issues criticos de seguridad

Si COMPLETO → invocar `release-manager`.
