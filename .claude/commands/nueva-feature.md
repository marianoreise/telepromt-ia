---
description: Kickoff completo de una nueva feature de punta a punta. Usar con: /nueva-feature [descripción]. Si no hay descripción, pedirla antes de continuar.
---
# /nueva-feature
Input: $ARGUMENTS

Si el input está vacío, preguntar qué se quiere construir antes de continuar.

## Pipeline (ejecutar en orden, sin pausar entre agentes salvo error)

**FASE 1 — Spec**
1. `product-lead` → Feature Spec en docs/specs/[nombre].md

**FASE 2 — Plan y exploración**
2. `planner` → tabla de subtareas con agente, dependencias y paralelizaciones
3. `explorer` → mapear archivos relevantes del codebase

**FASE 3 — Diseño**
4. `architect` → ADR + migration SQL + openapi.yaml + briefs por agente

**FASE 4 — Implementación (seguir orden del planner)**
5. `database-specialist` → ejecutar migration
6. `auth-specialist` → RLS policies (si aplica)
7. `backend` + `frontend` → en paralelo si no comparten archivos
8. `devops` → CI/CD y vars de entorno (si aplica)

**FASE 5 — Calidad**
9. `testing-specialist` → suite completa, coverage >= 80%
10. `reviewer` → code review del diff
11. `security-specialist` → audit (obligatorio si toca auth/pagos/datos usuario)

**FASE 6 — Cierre**
12. `judge` → validar criterios de aceptación
13. Si INCOMPLETO → volver al agente indicado
14. Si COMPLETO → skill `/git-workflow` para commit semántico
