#!/bin/bash
# Pre-deploy security check para Telepromt IA
ERRORS=0; WARNINGS=0
echo "=== Pre-Deploy Check ==="

# 1. Credenciales hardcodeadas
CRED=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.py" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=__pycache__ \
  -E 'sk-ant-[a-zA-Z0-9]+|sk-proj-[a-zA-Z0-9]+' . 2>/dev/null \
  | grep -v 'process\.env\|os\.environ\|test\|#' || true)
[ -n "$CRED" ] && echo "CRITICO: credenciales detectadas" && echo "$CRED" && ERRORS=$((ERRORS+1)) \
  || echo "OK: sin credenciales hardcodeadas"

# 2. .env trackeados
TRACKED=$(git ls-files 2>/dev/null | grep -E '^\.env' || true)
[ -n "$TRACKED" ] && echo "CRITICO: .env trackeado en git: $TRACKED" && ERRORS=$((ERRORS+1)) \
  || echo "OK: .env no trackeado"

# 3. TypeScript
TS_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo 0)
[ "$TS_ERRORS" -gt 0 ] 2>/dev/null \
  && echo "CRITICO: $TS_ERRORS errores TypeScript" && ERRORS=$((ERRORS+1)) \
  || echo "OK: TypeScript sin errores"

# 4. getSession() en API routes
SESSION=$(grep -rn "getSession()" apps/web/app/api/ --include="*.ts" 2>/dev/null || true)
[ -n "$SESSION" ] && echo "CRITICO: getSession() en API routes (usar getUser())" \
  && echo "$SESSION" && ERRORS=$((ERRORS+1)) || echo "OK: auth correcto en API routes"

echo "=== Resultado: $ERRORS criticos, $WARNINGS advertencias ==="
[ $ERRORS -gt 0 ] && echo "DEPLOY BLOQUEADO" && exit 2 \
  || echo "TODO OK - listo para deploy" && exit 0
