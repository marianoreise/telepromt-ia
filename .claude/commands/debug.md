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

## Paso 3 — Ciclo de fix (OBLIGATORIO en este orden exacto)
1. Agente responsable propone y aplica el fix
2. testing-specialist ejecuta tests unitarios + regresión + verifica coverage >= 80%
3. reviewer revisa el diff del fix
4. judge valida contra los criterios de aceptación
5. Si judge dice COMPLETO → hacer commit con /git-workflow
6. RECIÉN AHÍ reportar al humano: "Fix listo para que lo pruebes en [URL]"
Si cualquier paso falla → volver al paso 1. No reportar hasta que todo pase.

Si falla 3 veces → invocar `architect` para revisar la causa raíz de diseño.
