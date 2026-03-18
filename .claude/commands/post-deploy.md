---
description: Valida que producción está sana después de un deploy. Usar 3-5 minutos después de que el CI/CD termina.
---
# /post-deploy

```bash
FRONTEND_URL="${NEXT_PUBLIC_APP_URL:-https://[proyecto].vercel.app}"
BACKEND_URL="${NEXT_PUBLIC_API_URL:-https://[backend].railway.app}"
bash scripts/smoke-test.sh "$FRONTEND_URL" "$BACKEND_URL"
```

Invocar `deploy-validator` con las URLs y la versión actual:
```bash
git describe --tags --abbrev=0
```

Si PRODUCCION SANA → release cerrado.
Si PROBLEMAS → invocar `release-manager` con "hacer rollback".
