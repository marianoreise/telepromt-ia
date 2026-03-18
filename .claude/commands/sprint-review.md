---
description: Revisa el estado del sprint actual vs el roadmap del CLAUDE.md. Usar al final de cada semana.
---
# /sprint-review

```bash
echo "=== Commits del sprint (ultimas 2 semanas) ==="
git log --oneline --since="2 weeks ago" --pretty=format:"%h %s (%ar)"
echo "=== Features mergeadas a main ==="
git log main --oneline --since="2 weeks ago" | grep "feat(" || echo "ninguna"
echo "=== Coverage actual ==="
cd apps/web && npm test -- --coverage 2>&1 | grep "All files" 2>/dev/null || echo "correr tests"
echo "=== Sin commitear ==="
git status --short
```

Leer roadmap en CLAUDE.md y generar tabla de estado:
```
## Sprint Review — [fecha]
| Feature | ID | Estado | Sprint |
|---|---|---|---|
| Auth completa | F01 | Done/En progreso/Pendiente | S1-S2 |

### Metricas: N/M features · Coverage X% · Tests: N
### Proximas acciones: [accion — agente responsable]
### Riesgos: [riesgo — mitigacion]
```

Actualizar [x] en CLAUDE.md para features completadas.
