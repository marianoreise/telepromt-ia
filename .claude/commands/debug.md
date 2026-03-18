---
description: Debugging estructurado. Usar con: /debug [error exacto o descripción]. Identifica la capa, delega al agente correcto, agrega test de regresión.
---
# /debug
Problema: $ARGUMENTS

Si no hay descripción del error → pedirla antes de continuar.

## Paso 1 — Contexto
```bash
git diff --name-only HEAD~5..HEAD 2>/dev/null
npx tsc --noEmit 2>&1 | grep "error TS" | head -10
npm test 2>&1 | grep -E "FAIL|Error" | head -10
```

## Paso 2 — Identificar capa
| Sintoma | Capa | Agente |
|---|---|---|
| "relation does not exist" · RLS violation | BD | `database-specialist` |
| 401 · 403 · JWT expired | Auth | `auth-specialist` |
| 500 · stack trace Python | Backend | `backend` |
| White screen · TypeError · hydration | Frontend | `frontend` |
| Build failed · deploy timeout | CI/CD | `devops` |
| Cannot read env · Invalid API key · CORS | Config | `devops` |
| pgvector error · similitud baja | RAG | `backend` + `/rag-pipeline` |

## Paso 3 — Ciclo
1. Invocar el agente con el error completo
2. `reviewer` revisa el fix
3. Aplicar fix
4. Verificar que el error no se reproduce
5. `testing-specialist` → test de regresión
6. `git-workflow` → commit fix(scope): descripción

Si falla 3 veces → invocar `architect` para revisar la causa raíz de diseño.
