#!/bin/bash
# Smoke tests post-deploy para Telepromt IA
FRONTEND="${1:-http://localhost:3000}"
BACKEND="${2:-http://localhost:8000}"
ERRORS=0
echo "=== Smoke Tests === Frontend: $FRONTEND | Backend: $BACKEND"

check() {
  local label="$1" url="$2" expected="$3"
  actual=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" 2>/dev/null)
  [ "$actual" = "$expected" ] && echo "OK: $label ($actual)" \
    || (echo "FALLA: $label - esperado $expected, got $actual" && ERRORS=$((ERRORS+1)))
}

check "Backend /health"       "$BACKEND/health"             "200"
check "Frontend /"            "$FRONTEND"                   "200"
check "Frontend /login"       "$FRONTEND/login"             "200"

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 \
  -X POST "$BACKEND/api/v1/documents" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
{ [ "$API_STATUS" = "401" ] || [ "$API_STATUS" = "403" ] || [ "$API_STATUS" = "422" ]; } \
  && echo "OK: API protegida ($API_STATUS)" \
  || (echo "FALLA: API sin proteccion ($API_STATUS)" && ERRORS=$((ERRORS+1)))

echo "=== $ERRORS error(s) ==="
[ $ERRORS -eq 0 ] && echo "PRODUCCION SANA" && exit 0 || echo "PROBLEMAS DETECTADOS" && exit 1
