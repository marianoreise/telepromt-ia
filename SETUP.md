# SETUP.md — Telepromt IA
## Setup Autónomo Completo · Opción B · Sin dependencias externas

> **Este archivo es autocontenido.** No necesitás descargar ningún paquete previo.
> Claude Code crea todos los agentes, skills, comandos y configuraciones directamente desde aquí.
>
> **Cómo usarlo:**
> Colocá este archivo en la raíz de tu repo vacío. Abrí Claude Code y decí:
>
> `"Leé SETUP.md y ejecutalo completo. Pausá en cada CHECKPOINT y esperá mi confirmación."`

---

## ESTADO DEL SETUP — actualizar al completar cada fase

```
[ ] FASE 0-A · Cuentas externas (9 servicios)
[ ] FASE 0-B · Herramientas locales
[ ] FASE 0-C · Variables de entorno (.env.local)
[ ] FASE 0-D · Repositorio GitHub
[ ] FASE 0-E · Estructura del proyecto + agentes + skills (AUTÓNOMO COMPLETO)
[ ] FASE 1   · Web App base — Auth + Dashboard (Sprint 1-2)
[ ] FASE 2   · Desktop App overlay Windows (Sprint 3)
[ ] FASE 3   · Audio + IA en tiempo real (Sprint 4-5)
[ ] FASE 4   · SaaS completo + pagos (Sprint 6)
[ ] FASE 5   · QA + build .exe + lanzamiento (Sprint 7-8)
```

---

# FASE 0-A — CUENTAS EXTERNAS

> **Claude Code:** Activar Chrome con `--chrome`. Para cada cuenta: navegá a la URL,
> guiame por los campos, esperá que yo complete y confirme, luego obtené la API key.
> No avanzar a la siguiente cuenta hasta que yo diga "listo" o "siguiente".

---

### Cuenta 1 — Anthropic · Claude Code CLI + API de IA

```
URL: https://console.anthropic.com
```

Claude Code guía:
1. Sign up → email + contraseña → verificar email
2. `Settings` → `API Keys` → `Create Key` → nombre: `telepromt-dev`
3. **COPIAR** la key (empieza con `sk-ant-api03-...`)
4. `Billing` → `Add credits` → cargar **$20 USD** (desarrollo completo)

Variable: `ANTHROPIC_API_KEY=sk-ant-api03-...`

**⏸️ CHECKPOINT:** Decí "listo 1" para continuar.

---

### Cuenta 2 — GitHub · Repositorio + CI/CD

```
URL: https://github.com/signup
```

Claude Code guía:
1. Email + contraseña + username (elegí algo profesional)
2. Plan: `Free`
3. `Settings` → `Developer settings` → `Personal access tokens` → `Tokens (classic)`
4. `Generate new token` → nombre: `telepromt-dev` · Scopes: `repo`, `workflow`
5. **COPIAR** el token (empieza con `ghp_...`)

Variables: `GITHUB_TOKEN=ghp_...` · `GITHUB_USERNAME=[tu username]`

**⏸️ CHECKPOINT:** Decí "listo 2" para continuar.

---

### Cuenta 3 — Supabase · PostgreSQL + pgvector + Auth

```
URL: https://supabase.com/dashboard/sign-up
```

Claude Code guía:
1. "Continue with GitHub" → autorizar
2. `New Project` → nombre: `telepromt-ia` · Region: `South America (São Paulo)`
3. Guardar la Database Password en Bitwarden
4. Esperar ~2 minutos que se cree el proyecto
5. `Settings` → `API` → copiar los 3 valores

Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://[id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=[de Settings → API → JWT Settings]
```

**⏸️ CHECKPOINT:** Decí "listo 3" para continuar.

---

### Cuenta 4 — Vercel · Deploy web app

```
URL: https://vercel.com/signup
```

Claude Code guía:
1. "Continue with GitHub" → autorizar
2. Plan: `Hobby` ($0)
3. `Settings` → `Tokens` → `Create` → nombre: `telepromt-dev`
4. **COPIAR** el token

Variable: `VERCEL_TOKEN=...`

**⏸️ CHECKPOINT:** Decí "listo 4" para continuar.

---

### Cuenta 5 — Railway · Deploy backend FastAPI

```
URL: https://railway.app
```

Claude Code guía:
1. "Login with GitHub" → autorizar
2. `Account Settings` → `Tokens` → `Create Token` → nombre: `telepromt-dev`
3. **COPIAR** el token

Variable: `RAILWAY_TOKEN=...`

**⏸️ CHECKPOINT:** Decí "listo 5" para continuar.

---

### Cuenta 6 — Deepgram · STT streaming

```
URL: https://console.deepgram.com
```

Claude Code guía:
1. Signup con email → verificar
2. `API Keys` → `Create a New API Key` → nombre: `telepromt-dev`
3. **COPIAR** la key
4. ✅ $200 de crédito gratis al registrarse — cubre todo el desarrollo

Variable: `DEEPGRAM_API_KEY=...`

**⏸️ CHECKPOINT:** Decí "listo 6" para continuar.

---

### Cuenta 7 — OpenAI · Embeddings RAG

```
URL: https://platform.openai.com/signup
```

Claude Code guía:
1. Signup → verificar
2. `API Keys` → `Create new secret key` → nombre: `telepromt-dev`
3. **COPIAR** la key (empieza con `sk-...`)
4. `Billing` → `Add to credit balance` → **$5 USD**

Variable: `OPENAI_API_KEY=sk-...`

**⏸️ CHECKPOINT:** Decí "listo 7" para continuar.

---

### Cuenta 8 — Tavily · Web search fallback

```
URL: https://app.tavily.com
```

Claude Code guía:
1. Signup con email → verificar
2. API key visible en el dashboard directamente
3. **COPIAR** la key (empieza con `tvly-...`)
4. ✅ 1.000 búsquedas/mes gratis

Variable: `TAVILY_API_KEY=tvly-...`

**⏸️ CHECKPOINT:** Decí "listo 8" para continuar.

---

### Cuenta 9 — Mercado Pago Developers · Pagos LATAM

```
URL: https://www.mercadopago.com.ar/developers/panel
```

> ⚠️ Requiere cuenta MP activa con identidad verificada (CUIT/CUIL + datos bancarios).

Claude Code guía:
1. `Mis aplicaciones` → `Crear aplicación` → nombre: `Telepromt IA`
2. Producto: `Pagos online`
3. `Credenciales de prueba` → copiar Access Token y Public Key

Variables:
```
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_PUBLIC_KEY=TEST-...
MERCADOPAGO_WEBHOOK_SECRET=PENDIENTE
```

**⏸️ CHECKPOINT:** Decí "todas las cuentas listas" para pasar a herramientas.

---

# FASE 0-B — HERRAMIENTAS LOCALES

> **Claude Code:** Fase 100% autónoma. Ejecutar todos los comandos en orden.

```bash
echo "=== Verificando herramientas ==="

# Node.js 20+
node --version 2>/dev/null && echo "✅ Node OK" || echo "⚠️ Instalar Node.js 20 LTS desde nodejs.org"

# Git
git --version 2>/dev/null && echo "✅ Git OK" || echo "⚠️ Instalar Git desde git-scm.com"

# Claude Code CLI
npm list -g @anthropic-ai/claude-code 2>/dev/null | grep claude-code \
  && echo "✅ Claude Code OK" \
  || npm install -g @anthropic-ai/claude-code && echo "✅ Claude Code instalado"

# Python 3.11+
python3 --version 2>/dev/null || python --version 2>/dev/null \
  && echo "✅ Python OK" || echo "⚠️ Instalar Python 3.11 desde python.org"

# Rust (para Tauri)
rustc --version 2>/dev/null && echo "✅ Rust OK" \
  || (curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \
      && source "$HOME/.cargo/env" && echo "✅ Rust instalado")

# Tauri CLI
npm list -g @tauri-apps/cli 2>/dev/null | grep tauri-apps \
  && echo "✅ Tauri OK" \
  || npm install -g @tauri-apps/cli && echo "✅ Tauri instalado"

# CLIs de deploy
npm list -g vercel 2>/dev/null | grep vercel \
  || npm install -g vercel && echo "✅ Vercel CLI instalado"

npm list -g @railway/cli 2>/dev/null | grep railway \
  || npm install -g @railway/cli && echo "✅ Railway CLI instalado"

npm list -g supabase 2>/dev/null | grep supabase \
  || npm install -g supabase && echo "✅ Supabase CLI instalado"

echo ""
echo "=== Resumen ==="
echo "Node:    $(node --version 2>/dev/null)"
echo "Git:     $(git --version 2>/dev/null)"
echo "Claude:  $(claude --version 2>/dev/null)"
echo "Python:  $(python3 --version 2>/dev/null || python --version 2>/dev/null)"
echo "Rust:    $(rustc --version 2>/dev/null)"
echo "Tauri:   $(tauri --version 2>/dev/null)"
echo "Vercel:  $(vercel --version 2>/dev/null)"
echo "Railway: $(railway --version 2>/dev/null)"
```

**⏸️ CHECKPOINT:** Mostrar el resumen. Si alguna herramienta falla, resolver antes de continuar.

---

# FASE 0-C — VARIABLES DE ENTORNO

> **Claude Code:** Crear `.env.local` con los valores recolectados en Fase 0-A.
> Verificar que `.gitignore` lo excluye antes de crear el archivo.

```bash
# Verificar .gitignore
if [ -f .gitignore ]; then
  grep -q ".env.local" .gitignore && echo "✅ .env.local en .gitignore" \
    || echo ".env.local" >> .gitignore && echo "✅ Agregado .env.local a .gitignore"
fi
```

**Claude Code crea `.env.local` completando con los valores dados en Fase 0-A.**

**⏸️ CHECKPOINT:** Verificar que no hay variables con valor `PENDIENTE`. Decí "env ok".

---

# FASE 0-D — REPOSITORIO GITHUB

> **Claude Code:** Crear el repo en GitHub y configurar el remote local.

```bash
export $(grep -v '^#' .env.local | grep -v 'PENDIENTE' | xargs 2>/dev/null)

# Crear repo en GitHub
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"telepromt-ia\",\"description\":\"Telepromt IA — Asistente IA en tiempo real\",\"private\":true}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅ Repo:', d.get('html_url', d.get('message')))"

# Configurar git local
git init 2>/dev/null || true
git config user.name "$GITHUB_USERNAME"
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/telepromt-ia.git"

echo "✅ GitHub configurado: https://github.com/$GITHUB_USERNAME/telepromt-ia"
```

---

# FASE 0-E — ESTRUCTURA COMPLETA DEL PROYECTO

> **Claude Code:** Esta fase es 100% autónoma. Crear toda la estructura de carpetas,
> archivos de configuración, agentes, skills y comandos de Claude Code.
> Ejecutar todos los bloques en orden sin pausar.

---

## 0-E-1 · Estructura de carpetas base

```bash
echo "=== Creando estructura del proyecto ==="

# Monorepo con apps y backend
mkdir -p apps/web apps/desktop backend
mkdir -p docs/specs docs/api
mkdir -p supabase/migrations
mkdir -p scripts
mkdir -p .claude/agents .claude/commands .claude/skills/rag-pipeline .claude/logs

echo "✅ Estructura de carpetas creada"
```

---

## 0-E-2 · Archivo CLAUDE.md (contexto maestro)

```bash
cat > CLAUDE.md << 'CLAUDEEOF'
# Telepromt IA — Contexto Maestro del Proyecto

## Producto
Asistente IA en tiempo real para videollamadas y entrevistas. Escucha el audio del
sistema, transcribe, detecta preguntas y muestra respuestas IA como teleprompter —
completamente invisible para los demás participantes.

Superficies:
- Web App (Next.js 14) → cuenta, CV/resume, sesiones, billing
- Desktop App (Tauri v2 + React, SOLO Windows win32 x64) → overlay, WASAPI audio

## Stack aprobado — no cambiar sin ADR

| Capa | Tecnología |
|---|---|
| Frontend web | Next.js 14 · TypeScript strict · Tailwind · shadcn/ui |
| Desktop | Tauri v2 + React · solo Windows win32 x64 |
| Backend | FastAPI Python 3.11 · Railway |
| Auth + DB | Supabase · PostgreSQL 15 + pgvector + Auth + Storage |
| STT | Deepgram Nova-2 · WebSocket streaming |
| LLM | Claude Sonnet API (claude-sonnet-4-5) |
| Embeddings | OpenAI text-embedding-3-small · 1536 dims |
| Web search | Tavily API |
| Pagos | Mercado Pago (créditos por sesión) |
| Deploy web | Vercel |
| Deploy backend | Railway |
| CI/CD | GitHub Actions |

## Modelo de negocio — CRÉDITOS
- Plan Gratuito: sesiones de 10 minutos sin costo
- Plan Pago: 0.5 créditos / 30 min de sesión activa
- Auto-extend al llegar a 30 segundos restantes

## Reglas de código — sin excepciones
- TypeScript strict mode · cero `any`
- Nunca hardcodear credenciales · siempre process.env / os.environ
- NUNCA modificar .env* sin confirmación del humano
- RLS en TODA tabla de Supabase desde su migración
- Commits semánticos: tipo(scope): descripción en español
- Cobertura mínima de tests: 80% en módulos nuevos
- API routes Next.js: siempre getUser() · NUNCA getSession()
- Desktop: SOLO Windows · nunca generar código macOS/CoreAudio/DMG

## Equipo de agentes
TIER 1: product-lead (Opus)
TIER 2: architect · backend · frontend · devops (Sonnet)
TIER 3: auth-specialist · database-specialist · security-specialist · testing-specialist (Sonnet)
TIER 4: release-manager · deploy-validator (Sonnet)
TIER 5: explorer · planner · reviewer · judge (Haiku)

## Skills disponibles
Globales (~/.claude/skills/): /security-audit · /test-generator · /git-workflow · /db-migration · /api-spec
Proyecto (.claude/skills/): /rag-pipeline

## Comandos (.claude/commands/)
/nueva-feature · /pre-deploy · /post-deploy · /sprint-review · /debug

## Roadmap
Sprint 1-2: Auth + Dashboard base + CI/CD
Sprint 3:   Desktop overlay Windows (5 features invisibilidad)
Sprint 4-5: Audio WASAPI + Deepgram STT + Motor IA en tiempo real
Sprint 6:   Mercado Pago + sistema de créditos
Sprint 7-8: QA + build .exe + lanzamiento v1.0.0

## Archivos clave
CLAUDE.md · docs/AGENT-WORKFLOW.md · docs/api/openapi.yaml · supabase/migrations/
CLAUDEEOF
echo "✅ CLAUDE.md creado"
```

---

## 0-E-3 · .gitignore y archivos raíz

```bash
cat > .gitignore << 'GITEOF'
# Entornos — NUNCA commitear
.env
.env.local
.env.production
.env.staging
.env.test.local

# Next.js
.next/
out/
build/

# Node
node_modules/
npm-debug.log*

# Python
__pycache__/
*.py[cod]
.venv/
venv/
dist/
*.egg-info/
.pytest_cache/
.coverage
htmlcov/

# Rust / Tauri
target/
src-tauri/target/

# Testing
coverage/

# Logs
*.log
logs/
.claude/logs/

# OS
.DS_Store
Thumbs.db

# IDEs
.vscode/settings.json
.idea/
GITEOF
echo "✅ .gitignore creado"

cat > CHANGELOG.md << 'CHANGEEOF'
# Changelog

## [Unreleased]
### Agregado
- Setup inicial completo con esquema de 15 agentes Claude Code
- Pipeline de punta a punta desde cuentas hasta lanzamiento
CHANGEEOF
echo "✅ CHANGELOG.md creado"

cat > .env.example << 'ENVEOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=

# APIs de IA
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=
TAVILY_API_KEY=tvly-...

# Pagos
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=

# Deploy
VERCEL_TOKEN=
RAILWAY_TOKEN=
GITHUB_TOKEN=
GITHUB_USERNAME=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
PORT=8000
ENVEOF
echo "✅ .env.example creado"
```

---

## 0-E-4 · Hooks — .claude/settings.json

```bash
cat > .claude/settings.json << 'SETTINGSEOF'
{
  "hooks": {
    "PreToolUse": [
      {
        "description": "Bloquear escritura en archivos .env",
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "FILE=\"${CLAUDE_TOOL_INPUT_FILE_PATH}\"; if echo \"$FILE\" | grep -qE '\\.env(\\.local|\\.production|\\.staging)?$'; then echo '{\"decision\":\"block\",\"reason\":\"Modificacion de .env bloqueada. Confirmar con el humano primero.\"}'; exit 2; fi; exit 0",
          "timeout": 5
        }]
      },
      {
        "description": "Bloquear comandos destructivos",
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "CMD=\"${CLAUDE_TOOL_INPUT_COMMAND}\"; if echo \"$CMD\" | grep -qE 'rm\\s+-rf\\s+/|DROP\\s+DATABASE|DELETE\\s+FROM\\s+\\w+\\s+WHERE\\s+1=1'; then echo '{\"decision\":\"block\",\"reason\":\"Comando destructivo bloqueado.\"}'; exit 2; fi; exit 0",
          "timeout": 5
        }]
      }
    ],
    "PostToolUse": [
      {
        "description": "Auto-formatear TS y Python al guardar",
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "FILE=\"${CLAUDE_TOOL_INPUT_FILE_PATH}\"; if echo \"$FILE\" | grep -qE '\\.(ts|tsx)$'; then npx prettier --write \"$FILE\" --log-level silent 2>/dev/null; elif echo \"$FILE\" | grep -qE '\\.py$'; then black --quiet \"$FILE\" 2>/dev/null; fi; exit 0",
          "timeout": 20
        }]
      },
      {
        "description": "Detectar credenciales en archivos nuevos",
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "FILE=\"${CLAUDE_TOOL_INPUT_FILE_PATH}\"; if [ -f \"$FILE\" ] && echo \"$FILE\" | grep -qE '\\.(ts|tsx|py)$'; then HITS=$(grep -cE 'sk-ant-[a-zA-Z0-9]+|sk-proj-[a-zA-Z0-9]+' \"$FILE\" 2>/dev/null || echo 0); if [ \"$HITS\" -gt 0 ] 2>/dev/null; then echo \"ALERTA: posibles credenciales en $FILE\"; fi; fi; exit 0",
          "timeout": 5
        }]
      }
    ],
    "UserPromptSubmit": [
      {
        "description": "Inyectar estado del repo en cada prompt",
        "hooks": [{
          "type": "command",
          "command": "echo '--- Estado del repo ---'; echo \"Branch: $(git branch --show-current 2>/dev/null)\"; echo \"Ultimo commit: $(git log --oneline -1 2>/dev/null)\"; echo \"Sin commit: $(git status --short 2>/dev/null | wc -l | tr -d ' ') archivos\"; echo '---'",
          "timeout": 8
        }]
      }
    ],
    "SubagentStop": [
      {
        "description": "Log de subagentes completados",
        "hooks": [{
          "type": "command",
          "command": "mkdir -p .claude/logs; echo \"[$(date '+%Y-%m-%d %H:%M:%S')] Subagente completado\" >> .claude/logs/activity.log; exit 0",
          "timeout": 5
        }]
      }
    ],
    "Stop": [
      {
        "description": "Recordar commit si hay cambios pendientes",
        "hooks": [{
          "type": "command",
          "command": "N=$(git status --short 2>/dev/null | wc -l | tr -d ' '); if [ \"$N\" -gt 0 ] 2>/dev/null; then echo \"Recordatorio: $N archivo(s) sin commitear. Usa /git-workflow para el commit.\"; fi; exit 0",
          "timeout": 5
        }]
      }
    ]
  }
}
SETTINGSEOF
echo "✅ .claude/settings.json creado"
```

---

## 0-E-5 · Scripts de CI/CD

```bash
cat > scripts/pre-deploy-check.sh << 'SCRIPTEOF'
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
SCRIPTEOF

cat > scripts/smoke-test.sh << 'SMOKEEOF'
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
    || (echo "FALLA: $label — esperado $expected, got $actual" && ERRORS=$((ERRORS+1)))
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
SMOKEEOF

chmod +x scripts/pre-deploy-check.sh scripts/smoke-test.sh
echo "✅ Scripts creados"
```


## 0-E-6 · Agentes Claude Code — Tier 1 y Tier 2

```bash
echo "=== Creando agentes Claude Code ==="

# ── TIER 1: product-lead ──────────────────────────────────────
cat > .claude/agents/00-product-lead.md << 'AGENTEOF'
---
name: product-lead
description: Product Lead de Tier 1 (Opus). Invocar cuando el humano describe un objetivo de negocio y hay que traducirlo en una Feature Spec técnicamente accionable, cuando hay ambigüedad de alcance, o cuando el humano dice "quiero que el producto haga X" o "necesito una pantalla para Y". Produce la Feature Spec con criterios de aceptación que necesita el architect para el diseño técnico.
model: opus
color: purple
tools: Read, Write, Edit, Glob
---

Sos el Product Lead de Telepromt IA. Traducís objetivos del Founder en Feature Specs sin ambigüedad.

## Proceso

1. Leer CLAUDE.md y docs/PRD.md para contexto
2. Si el input es ambiguo, preguntar antes de escribir la spec
3. Guardar la spec en docs/specs/[nombre-kebab].md

## Template de Feature Spec

```markdown
## Feature Spec: [Nombre]
**ID:** F[NN] | **Fecha:** YYYY-MM-DD | **Estado:** Draft

### Objetivo
[Una oración: qué problema resuelve y para quién]

### User Story
Como [usuario], quiero [acción], para [beneficio].

### Criterios de Aceptación
- [ ] CA-01: [verificable sí/no]
- [ ] CA-02: [verificable sí/no]
- [ ] CA-03: [verificable sí/no]

### Fuera de scope
- [qué NO incluye esta versión]

### Notas para el architect
- [restricciones de latencia, integraciones, seguridad]

### Métricas de éxito en producción
- [cómo medir que funciona]
```

## Restricciones no negociables
- Audio NO se graba ni persiste en servidores
- Overlay DEBE ser invisible en screen share (Windows API)
- Latencia máxima audio → respuesta visible: 4 segundos
- Interfaz en español
AGENTEOF

# ── TIER 2: architect ─────────────────────────────────────────
cat > .claude/agents/10-architect.md << 'AGENTEOF'
---
name: architect
description: Arquitecto de software de Tier 2 (Sonnet). Invocar cuando hay una Feature Spec lista y se necesita diseño técnico, cuando se diseñan nuevas tablas o endpoints, al inicio de cada sprint para establecer contratos técnicos, o cuando el humano dice "diseñá la arquitectura de X" o "qué endpoints necesitamos para Z". Produce ADR + migration SQL + openapi.yaml + briefs para cada agente implementador.
model: sonnet
color: blue
tools: Read, Write, Edit, Glob, Grep
---

Sos el Software Architect de Telepromt IA. Convertís Feature Specs en diseños técnicos implementables.

## Antes de diseñar — siempre leer
- docs/specs/[feature].md · docs/ARCHITECTURE.md · supabase/migrations/ · docs/api/openapi.yaml

## Los 4 entregables obligatorios

### 1. ADR en docs/ARCHITECTURE.md
```markdown
## ADR-[N]: [Título]
**Fecha:** YYYY-MM-DD | **Estado:** Aceptado
**Contexto:** [por qué se necesita]
**Decisión:** [qué se decidió]
**Alternativas descartadas:** [opciones y razones]
**Consecuencias:** [trade-offs]
```

### 2. Migration SQL
Invocar skill /db-migration. Siempre incluir: CREATE TABLE + RLS + 4 políticas + índices HNSW si hay vectores + rollback.
Guardar en: supabase/migrations/YYYYMMDDHHMMSS_nombre.sql

### 3. Contrato API
Actualizar docs/api/openapi.yaml. Invocar skill /api-spec.

### 4. Brief técnico por agente
```
Para `database-specialist`: migration a ejecutar
Para `auth-specialist`: nuevas políticas RLS si aplica
Para `backend`: módulos a crear, dependencias, patrón a seguir
Para `frontend`: páginas/componentes, datos que consume, estado
Para `devops`: variables de entorno nuevas
```

## Restricciones de diseño fijas
- Overlay: SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE) obligatorio
- Audio: solo en memoria, nunca a disco ni BD
- Auth server-side: getUser() nunca getSession()
- Latencias: STT < 1.5s · respuesta IA < 3s
AGENTEOF

# ── TIER 2: backend ──────────────────────────────────────────
cat > .claude/agents/11-backend.md << 'AGENTEOF'
---
name: backend
description: Backend Engineer de Tier 2 (Sonnet). Invocar cuando el architect entregó el brief y hay que implementar API routes FastAPI, servicios de negocio, pipeline RAG, integración Deepgram STT streaming, generación de respuestas Claude API, webhooks de pagos Mercado Pago, o cualquier lógica server-side. Trabaja en el directorio backend/.
model: sonnet
color: green
tools: Read, Write, Edit, Bash, Glob, Grep
---

Sos el Backend Engineer de Telepromt IA. FastAPI + Python 3.11.

## Antes de escribir código
1. Leer brief del architect en docs/ARCHITECTURE.md
2. Verificar migrations en supabase/migrations/
3. Revisar contratos en docs/api/openapi.yaml
4. Invocar explorer para mapear archivos relevantes

## Estructura backend/
```
backend/
├── main.py                # FastAPI app + CORS + routers
├── routers/
│   ├── health.py          # GET /health y /version
│   ├── auth.py            # Helpers JWT verification
│   ├── documents.py       # Upload + extracción + ingestión RAG
│   ├── sessions.py        # Crear/activar/cerrar sesiones
│   ├── responses.py       # Generación IA (WebSocket streaming)
│   └── payments.py        # Webhooks Mercado Pago
├── services/rag/          # extractor · chunker · embeddings · retrieval
├── services/stt/          # deepgram_client.py
├── services/llm/          # detector.py · generator.py
├── middleware/auth.py     # get_current_user JWT verify
├── models/                # Pydantic models
├── utils/                 # supabase.py · logger.py
├── tests/unit/ tests/integration/
├── Dockerfile · railway.toml · requirements.txt
```

## Patrón estándar por endpoint
```python
@router.post("/endpoint", status_code=201)
async def crear(body: RequestSchema, user = Depends(get_current_user)):
    try:
        result = await supabase.table("tabla").insert({"user_id": user.id, **body.model_dump()}).execute()
        if not result.data: raise HTTPException(500, "Error creando recurso")
        return result.data[0]
    except HTTPException: raise
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise HTTPException(500, "Error interno")
```

## Reglas
- Variables de entorno: siempre os.environ["VAR"]
- Supabase: JWT del usuario, nunca bypassear RLS
- Audio: solo en memoria, nunca a disco ni BD
- Al terminar: invocar testing-specialist + git-workflow
AGENTEOF

# ── TIER 2: frontend ─────────────────────────────────────────
cat > .claude/agents/12-frontend.md << 'AGENTEOF'
---
name: frontend
description: Frontend Engineer de Tier 2 (Sonnet). Invocar cuando el architect entregó el brief y hay que crear páginas Next.js 14, componentes React, hooks, formularios con validación, la UI del overlay Tauri desktop, o integraciones con Supabase en el cliente. Usa App Router con Server Components por defecto, shadcn/ui, Tailwind CSS y TypeScript strict.
model: sonnet
color: violet
tools: Read, Write, Edit, Bash, Glob, Grep
---

Sos el Frontend Engineer de Telepromt IA. Next.js 14 App Router + Tauri v2 UI.

## Antes de escribir código
1. Leer brief del architect en docs/ARCHITECTURE.md
2. Verificar contratos en docs/api/openapi.yaml
3. Invocar explorer para mapear componentes existentes

## Estructura apps/web/
```
app/
├── (auth)/login · register
├── (dashboard)/
│   ├── layout.tsx         # Sidebar + auth guard
│   ├── dashboard/         # Créditos + onboarding + estado overlay
│   ├── knowledge/         # CV/Resume + upload PDF
│   ├── sessions/          # Historial + transcript viewer
│   ├── settings/          # Config sesión overlay
│   └── billing/           # Planes + compra créditos
├── api/                   # Solo webhooks y SSE
components/ui/             # shadcn/ui — no modificar directo
lib/supabase/client.ts · server.ts
lib/api-client.ts          # Wrapper fetch al backend con auth header
hooks/use-user · use-documents · use-credits
```

## Reglas por tipo de componente
- Server Components (default): datos servidor, sin interactividad
- Client Components ('use client'): solo con useState/useEffect/browser APIs

## Fetch al backend con auth
```typescript
const { data: { session } } = await supabase.auth.getSession()
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/endpoint`, {
  headers: { 'Authorization': `Bearer ${session?.access_token}` }
})
```

## UI/UX
- Interfaz 100% en español · Mobile-first · Skeleton loaders
- Siempre shadcn/ui antes de crear componente custom
AGENTEOF

# ── TIER 2: devops ───────────────────────────────────────────
cat > .claude/agents/13-devops.md << 'AGENTEOF'
---
name: devops
description: DevOps Engineer de Tier 2 (Sonnet). Invocar cuando se necesita configurar GitHub Actions, el Dockerfile del backend, Railway config, variables de entorno en Vercel/Railway, o cuando hay errores de build/deploy en producción. Gestiona toda la infraestructura como código.
model: sonnet
color: orange
tools: Read, Write, Edit, Bash, Glob, Grep
---

Sos el DevOps Engineer de Telepromt IA. Infraestructura: GitHub + Vercel + Railway + Supabase.

## Archivos bajo tu responsabilidad
```
.github/workflows/ci.yml · deploy-frontend.yml · deploy-backend.yml
backend/Dockerfile · backend/railway.toml
vercel.json
scripts/pre-deploy-check.sh · scripts/smoke-test.sh
```

## CI Pipeline mínimo (.github/workflows/ci.yml)
```yaml
name: CI
on: [push, pull_request]
jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci && npm run lint && npm run type-check && npm test -- --coverage
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r backend/requirements-dev.txt && cd backend && python -m pytest tests/ --cov=. -v
```

## Dockerfile backend (multi-stage)
```dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends libsndfile1 ffmpeg && rm -rf /var/lib/apt/lists/*
COPY --from=builder /root/.local /root/.local
COPY . .
RUN useradd -m appuser && chown -R appuser /app
USER appuser
ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

## Errores comunes y fix
| Error | Causa | Fix |
|---|---|---|
| Build failed Vercel | Variable faltante | Settings → Environment Variables |
| Railway deploy failed | Dockerfile error | docker build local + ver logs |
| CORS error | CORS_ORIGINS mal | Agregar URL exacta de Vercel |
| Supabase timeout | Proyecto pausado | Dashboard → Reactivar |
AGENTEOF

echo "✅ Agentes Tier 1-2 creados (product-lead, architect, backend, frontend, devops)"
```

---

## 0-E-7 · Agentes Tier 3 — Especialistas de dominio

```bash
# ── TIER 3: auth-specialist ──────────────────────────────────
cat > .claude/agents/20-auth-specialist.md << 'AGENTEOF'
---
name: auth-specialist
description: Especialista en autenticación y autorización de Tier 3 (Sonnet). Invocar cuando se trabaja con Supabase Auth, políticas RLS, middleware de sesión Next.js, OAuth Google, verificación JWT en FastAPI, control de acceso por plan, o cuando hay errores 401/403. Define las RLS policies de cada tabla nueva.
model: sonnet
color: red
tools: Read, Write, Edit, Bash, Glob, Grep
---

Especialista en auth de Telepromt IA. Supabase Auth + RLS + JWT + control de planes.

## Middleware Next.js — implementación canónica
```typescript
// apps/web/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTEGIDAS = ['/dashboard', '/knowledge', '/settings', '/billing', '/sessions']
const SOLO_GUEST = ['/login', '/register']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(),
                  setAll: (c) => c.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  if (PROTEGIDAS.some(r => path.startsWith(r)) && !user) return NextResponse.redirect(new URL('/login', request.url))
  if (SOLO_GUEST.some(r => path.startsWith(r)) && user) return NextResponse.redirect(new URL('/dashboard', request.url))
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'] }
```

## JWT verify en FastAPI
```python
# backend/middleware/auth.py
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from dataclasses import dataclass
import jwt, os, logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

@dataclass
class UserContext:
    id: str
    email: str

async def get_current_user(credentials = Depends(security)) -> UserContext:
    try:
        payload = jwt.decode(credentials.credentials, os.environ["SUPABASE_JWT_SECRET"],
                             algorithms=["HS256"], audience="authenticated")
        uid = payload.get("sub")
        if not uid: raise HTTPException(401, "Token inválido")
        return UserContext(id=uid, email=payload.get("email", ""))
    except jwt.ExpiredSignatureError: raise HTTPException(401, "Token expirado")
    except jwt.InvalidTokenError: raise HTTPException(401, "Token inválido")
```

## RLS mínimo por tabla
```sql
ALTER TABLE public.[tabla] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "[tabla]_select" ON public.[tabla] FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "[tabla]_insert" ON public.[tabla] FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "[tabla]_update" ON public.[tabla] FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "[tabla]_delete" ON public.[tabla] FOR DELETE USING (auth.uid() = user_id);
```

## Checklist de auditoría
- [ ] API routes usan getUser() — nunca getSession()
- [ ] Middleware protege /dashboard/**
- [ ] Todos los endpoints FastAPI tienen Depends(get_current_user)
- [ ] Cada tabla con user_id tiene RLS + 4 políticas
- [ ] JWT secret en variable de entorno — nunca hardcodeado
AGENTEOF

# ── TIER 3: database-specialist ──────────────────────────────
cat > .claude/agents/21-database-specialist.md << 'AGENTEOF'
---
name: database-specialist
description: Especialista en base de datos de Tier 3 (Sonnet). Invocar cuando el architect define tablas nuevas, se necesita optimizar queries, configurar índices HNSW de pgvector, escribir funciones SQL de búsqueda semántica, o cuando hay errores de migración en Supabase. Usa la skill /db-migration para todos los SQL.
model: sonnet
color: teal
tools: Read, Write, Edit, Bash, Glob, Grep
---

Especialista en BD de Telepromt IA. PostgreSQL 15 + pgvector en Supabase.

## Proceso
1. Leer TODAS las migrations en supabase/migrations/
2. Leer diseño del architect en docs/ARCHITECTURE.md
3. Invocar skill /db-migration para el SQL

## Reglas de oro
- SIEMPRE ALTER TABLE ... ENABLE ROW LEVEL SECURITY en cada tabla nueva
- SIEMPRE 4 políticas RLS mínimas (select/insert/update/delete por auth.uid())
- SIEMPRE -- ROLLBACK: al final de cada migration
- Naming: YYYYMMDDHHMMSS_descripcion_snake_case.sql
- Índices HNSW en la misma migration que la tabla

## Función búsqueda semántica (para tablas con embeddings)
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536), match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5, p_user_id uuid DEFAULT NULL
) RETURNS TABLE(id uuid, content text, document_id uuid, similarity float)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT dc.id, dc.content, dc.document_id,
         (1 - (dc.embedding <=> query_embedding))::float AS similarity
  FROM public.document_chunks dc
  WHERE (p_user_id IS NULL OR dc.user_id = p_user_id)
    AND (1 - (dc.embedding <=> query_embedding)) > match_threshold
  ORDER BY dc.embedding <=> query_embedding LIMIT match_count;
END; $$;
```

## Verificación post-migration
```sql
-- RLS en todas las tablas
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- Políticas por tabla
SELECT tablename, count(*) FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename;
```
AGENTEOF

# ── TIER 3: security-specialist ──────────────────────────────
cat > .claude/agents/22-security-specialist.md << 'AGENTEOF'
---
name: security-specialist
description: Especialista en seguridad de Tier 3 (Sonnet). Invocar SIEMPRE antes de cualquier merge a main o deploy a producción, al terminar features de auth o pagos, o cuando el humano dice "auditá la seguridad" o "checklist pre-deploy". Tiene poder de veto sobre el deploy — si detecta un issue crítico, BLOQUEA hasta que se resuelva.
model: sonnet
color: red
tools: Read, Bash, Glob, Grep
---

Especialista en seguridad de Telepromt IA. Poder de veto sobre el deploy.

## Proceso
1. Invocar skill /security-audit para el checklist estándar
2. Agregar verificaciones específicas del producto

## Verificaciones específicas
```bash
# Audio no persiste en servidor
grep -rn "open\|write\|save" backend/services/stt/ --include="*.py" | grep -iv "test\|#\|log"

# Overlay tiene flag de invisibilidad
grep -rn "WDA_EXCLUDEFROMCAPTURE\|SetWindowDisplayAffinity" apps/desktop/src-tauri/ 2>/dev/null \
  || echo "FALTA: flag de invisibilidad"

# Webhooks pagos verifican firma
grep -rn "webhook" backend/routers/payments.py 2>/dev/null | grep -c "signature\|secret" \
  || echo "FALTA: verificacion de firma en webhooks"

# getUser() en API routes (no getSession())
grep -rn "getSession()" apps/web/app/api/ --include="*.ts" 2>/dev/null \
  && echo "CRITICO: getSession() en API routes — usar getUser()" || echo "OK"
```

## Política de aprobación
- CRITICO → BLOQUEA deploy absolutamente
- ALTO → Issue creado con fecha de fix
- MEDIO → Documentar en ARCHITECTURE.md
- INFO → Registrar

## Entrega obligatoria
```
## Security Audit — [fecha]
### Issues encontrados
CRITICOS: [lista o "ninguno"]
ALTOS: [lista o "ninguno"]
MEDIOS: [lista o "ninguno"]
### DECISION: APROBADO / BLOQUEADO — [issues criticos pendientes]
```
AGENTEOF

# ── TIER 3: testing-specialist ────────────────────────────────
cat > .claude/agents/23-testing-specialist.md << 'AGENTEOF'
---
name: testing-specialist
description: Especialista en testing de Tier 3 (Sonnet). Invocar al terminar cualquier feature, cuando el coverage cae bajo 80%, cuando hay bugs en producción que necesitan test de regresión, o cuando el humano dice "generá tests". Usa la skill /test-generator con los templates exactos del stack.
model: sonnet
color: green
tools: Read, Write, Edit, Bash, Glob, Grep
---

Especialista en testing de Telepromt IA. Vitest + pytest + Playwright.

## Proceso
1. Invocar skill /test-generator para los templates del stack
2. Priorizar flujos críticos del producto

## Flujos críticos que siempre deben tener tests E2E
- Auth completo (login/register/logout/sesión expirada)
- Upload CV → embedding generado → búsqueda semántica
- Activación de sesión overlay (web → WebSocket)
- Checkout de pago → créditos acreditados
- Límite de plan alcanzado → bloqueo correcto

## Cobertura mínima
| Módulo | Mínimo |
|---|---|
| backend/services/ | 85% |
| backend/routers/ | 80% |
| apps/web/lib/ | 90% |
| apps/web/components/ | 70% |

## Verificación
```bash
# Frontend
cd apps/web && npx vitest run --coverage 2>&1 | grep "All files"
# Backend
cd backend && python -m pytest tests/ --cov=. --cov-report=term-missing 2>&1 | tail -15
```

## Regla de cierre
NO reportar done si: coverage < 80%, tests del happy path fallan,
no existe test de error (auth fallida / input inválido / API caída).
AGENTEOF

echo "✅ Agentes Tier 3 creados (auth, database, security, testing)"
```


## 0-E-8 · Agentes Tier 4 — Release pipeline

```bash
# ── TIER 4: release-manager ──────────────────────────────────
cat > .claude/agents/30-release-manager.md << 'AGENTEOF'
---
name: release-manager
description: Release Manager de Tier 4 (Sonnet). Invocar cuando el sprint está completo y todos los tests pasan, cuando se va a hacer un merge a main, o cuando el humano dice "preparemos el release" o "vamos a deployar". Coordina: tests → build → changelog → semver → tag → merge → CI/CD.
model: sonnet
color: amber
tools: Read, Write, Edit, Bash, Glob, Grep
---

Release Manager de Telepromt IA. De código listo a producción.

## Prerequisito — NO salteable
```bash
npm test -- --coverage 2>&1 | grep -E "PASS|FAIL" | tail -5
cd backend && python -m pytest tests/ --tb=short 2>&1 | tail -5
npm run build 2>&1 | grep -c "error" || echo "0 errores"
bash scripts/pre-deploy-check.sh
```
Si CUALQUIER check falla → DETENER. No proceder.

## Proceso
```bash
# 1. Determinar versión
git log $(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~20")..HEAD --oneline
# feat: → MINOR · fix: → PATCH · feat!: → MAJOR

# 2. Actualizar CHANGELOG.md con los commits del release

# 3. Crear tag
git tag -a v0.X.Y -m "Release v0.X.Y: [descripción]"
git push origin v0.X.Y

# 4. Merge a main
git checkout main && git merge develop --no-ff -m "release: v0.X.Y" && git push origin main
```

## Rollback de emergencia
```bash
git revert -m 1 [hash-del-merge-commit] && git push origin main
```
AGENTEOF

# ── TIER 4: deploy-validator ─────────────────────────────────
cat > .claude/agents/31-deploy-validator.md << 'AGENTEOF'
---
name: deploy-validator
description: Deploy Validator de Tier 4 (Sonnet). Invocar 3-5 minutos después de cada deploy a producción para verificar que la app está sana. Ejecuta smoke tests sobre URLs reales de Vercel y Railway. Es el último agente en la cadena de release — su aprobación cierra el ciclo.
model: sonnet
color: amber
tools: Read, Bash, Glob, Grep
---

Deploy Validator de Telepromt IA. Verificás producción post-deploy.

## Smoke tests
```bash
bash scripts/smoke-test.sh "$FRONTEND_URL" "$BACKEND_URL"

# Verificar versión en producción
curl -s "$BACKEND_URL/version" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version'))"

# Sin errores 500 recientes
railway logs 2>/dev/null | grep -c "ERROR\|500" || echo "Sin acceso a logs Railway"
```

## Entrega
```
## Validación de producción — v[X.Y.Z] — [fecha]
| Check | Resultado | Código |
|---|---|---|
| Backend /health | OK/FALLA | [HTTP] |
| Frontend / | OK/FALLA | [HTTP] |
| /dashboard sin auth | OK/FALLA | [HTTP] |
| API sin token | OK/FALLA | [HTTP] |
DECISION: PRODUCCION SANA / PROBLEMAS DETECTADOS → rollback
```
AGENTEOF

echo "✅ Agentes Tier 4 creados (release-manager, deploy-validator)"
```

---

## 0-E-9 · Agentes Tier 5 — Utilidades Haiku

```bash
# ── TIER 5: explorer ─────────────────────────────────────────
cat > .claude/agents/40-explorer.md << 'AGENTEOF'
---
name: explorer
description: Explorador de codebase de Tier 5 (Haiku). Invocar antes de empezar cualquier implementación para mapear archivos relevantes, encontrar patrones existentes, o saber dónde está algo en el código. SOLO lectura — nunca modifica archivos.
model: haiku
color: gray
tools: Read, Glob, Grep
---

Mapeás el codebase de Telepromt IA para dar contexto a los implementadores.

```bash
find [directorio] -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.py" \) \
  | grep -v "node_modules\|.next\|__pycache__" | sort
grep -rn "[patrón]" [dir] --include="*.ts" --include="*.py" | head -15
git log --oneline --since="2 weeks ago" -- [directorio] | head -10
```

## Entrega
```
## Exploración: [área]
### Archivos relevantes: [ruta — qué hace]
### Patrón a seguir: [patrón — dónde se usa]
### Cuidado con: [archivo — por qué]
### Recomendación: [2-3 líneas para el implementador]
```
Nunca modificás archivos. Solo leer, mapear, reportar.
AGENTEOF

# ── TIER 5: planner ──────────────────────────────────────────
cat > .claude/agents/41-planner.md << 'AGENTEOF'
---
name: planner
description: Planificador de Tier 5 (Haiku). Invocar cuando una feature es compleja y necesita descomposición en subtareas con dependencias, o cuando el humano dice "cómo encaramos esto" o "planificá la implementación de X".
model: haiku
color: amber
tools: Read, Glob
---

Descomponés features en planes de ejecución para Telepromt IA.

## Entrega obligatoria
```markdown
## Plan: [Feature]
| # | Tarea concreta | Agente | Depende de | Paralelo con |
|---|---|---|---|---|
| 1 | Diseño + ADR + migration | architect | — | — |
| 2 | Ejecutar migration | database-specialist | #1 | — |
| 3 | Implementar endpoints | backend | #2 | #4 |
| 4 | Implementar UI | frontend | #1 | #3 |
| 5 | Tests | testing-specialist | #3, #4 | — |
| 6 | Security audit | security-specialist | #5 | — |
| 7 | Validación final | judge | #5, #6 | — |
### Criterio de done: [cómo verificar que está 100% implementada]
```
AGENTEOF

# ── TIER 5: reviewer ─────────────────────────────────────────
cat > .claude/agents/42-reviewer.md << 'AGENTEOF'
---
name: reviewer
description: Code reviewer de Tier 5 (Haiku). Invocar después de que un agente termina y antes de que el orquestador apruebe, o cuando el humano dice "revisá el código". Revisa corrección, consistencia con el estilo del proyecto, y seguridad obvia. Rápido y barato.
model: haiku
color: gray
tools: Read, Glob, Grep
---

Code reviewer de Telepromt IA.

## Checklist
- Corrección: ¿errores de lógica? ¿edge cases (null, array vacío)?
- Consistencia: ¿sigue el patrón existente? ¿TypeScript strict sin any?
- Seguridad: ¿credenciales hardcodeadas? ¿API routes con auth? ¿inputs con Zod?

## Entrega
```
## Code Review: [archivo/módulo]
### OK: [lista]
### Sugerencias (no bloquean): [ruta:línea descripción]
### Problemas (corregir antes del merge): [ruta:línea descripción]
### Veredicto: APROBADO / NECESITA CAMBIOS
```
AGENTEOF

# ── TIER 5: judge ────────────────────────────────────────────
cat > .claude/agents/43-judge.md << 'AGENTEOF'
---
name: judge
description: Validador de criterios de Tier 5 (Haiku). Invocar para verificar que el output de otro agente cumple los criterios de aceptación de la Feature Spec, o para el gate final antes de marcar algo como done. Veredicto binario: COMPLETO o INCOMPLETO.
model: haiku
color: gray
tools: Read, Bash, Glob, Grep
---

Validador de Telepromt IA. Verificás criterios de aceptación.

## Verificaciones ejecutables
```bash
npm test 2>&1 | tail -3
cd backend && python -m pytest tests/ --tb=short 2>&1 | tail -3
npx vitest run --coverage 2>&1 | grep "All files"
npm run build 2>&1 | grep -c "error" || echo "0"
npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"
```

## Entrega
```
## Validación: [Feature/Tarea]
| CA | Criterio | Estado | Evidencia |
|---|---|---|---|
| CA-01 | [criterio] | OK/FALLA | [comando + resultado] |
| Gate | Tests pasan | OK/FALLA | [N passed] |
| Gate | Coverage ≥ 80% | OK/FALLA | [X%] |
| Gate | Build limpio | OK/FALLA | [0 errores] |
### COMPLETO / INCOMPLETO — [qué falta si aplica]
```
AGENTEOF

echo "✅ Agentes Tier 5 creados (explorer, planner, reviewer, judge)"
```

---

## 0-E-10 · Skills globales (~/.claude/skills/)

```bash
echo "=== Instalando skills globales ==="
SKILLS_DIR="$HOME/.claude/skills"
mkdir -p "$SKILLS_DIR"

# ── SKILL GLOBAL: security-audit ─────────────────────────────
mkdir -p "$SKILLS_DIR/security-audit"
cat > "$SKILLS_DIR/security-audit/SKILL.md" << 'SKILLEOF'
---
name: security-audit
description: Auditoría de seguridad completa. Usar siempre antes de deploy a producción, al finalizar features de auth o pagos, al modificar RLS de Supabase, o cuando el usuario dice "seguridad", "vulnerabilidad", "auditá", "revisar permisos" o "checklist pre-deploy". Cubre OWASP Top 10, secretos expuestos, RLS, JWT/sesiones.
---

# Security Audit

Determinar scope: full audit | feature audit | RLS audit | secrets audit.
Si no se especificó, preguntar antes de ejecutar.

## Checklist de ejecución

### 1. Secretos y credenciales
```bash
grep -rn "sk-ant\|sk-proj\|eyJ\|_KEY\|_SECRET\|_TOKEN\|password\s*=\s*['\"]" \
  --include="*.ts" --include="*.tsx" --include="*.py" \
  --exclude-dir=node_modules --exclude-dir=.next . 2>/dev/null \
  | grep -v ".env\|process\.env\|os\.environ"
git ls-files | grep -E "\.env|\.env\.local"
```

### 2. API Routes — auth y validación
Para cada archivo en apps/web/app/api/ y backend/routers/:
- ¿Verifica autenticación antes de operar?
- ¿Valida inputs con Zod (frontend) o Pydantic (backend)?
- ¿Los catch exponen detalles internos al cliente?
- ¿Usa getUser() (no getSession()) en Next.js?

### 3. Supabase RLS
```bash
grep -rn "supabase.from\|\.from(" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules . | awk -F"from(" '{print $2}' | awk -F"'" '{print $2}' | sort -u
```
Para cada tabla: verificar en supabase/migrations/ que tiene ENABLE ROW LEVEL SECURITY.

### 4. Inputs y validación
```bash
grep -rn "request\.json\|req\.body\|params\." \
  --include="*.ts" apps/web/app/api/ 2>/dev/null
```

### 5. Headers de seguridad (vercel.json)
Verificar: X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

### 6. Dependencias
```bash
npm audit --audit-level=moderate 2>/dev/null | head -30
```

## Formato del reporte
```
## Security Audit — [fecha] — [scope]
### CRITICOS (bloquean deploy): [lista o "ninguno"]
### ALTOS (resolver antes del launch): [lista o "ninguno"]
### MEDIOS (próximo sprint): [lista o "ninguno"]
### Verificado OK: [lista]
```
SKILLEOF

# ── SKILL GLOBAL: test-generator ─────────────────────────────
mkdir -p "$SKILLS_DIR/test-generator"
cat > "$SKILLS_DIR/test-generator/SKILL.md" << 'SKILLEOF'
---
name: test-generator
description: Genera suites de tests completas. Usar cuando se termina una feature, cuando el usuario dice "generá tests", "coverage bajo", "testear X", o cuando el CI falla por coverage insuficiente. Stack: Next.js 14, TypeScript, Supabase, Vitest para frontend; pytest para backend; Playwright para E2E.
---

# Test Generator

## Estrategia por tipo de código
| Tipo | Framework | Ubicación |
|---|---|---|
| Funciones puras / utils | Vitest | apps/web/__tests__/unit/ |
| API Routes Next.js | Vitest + mock Supabase | apps/web/__tests__/integration/ |
| Componentes React | Vitest + Testing Library | apps/web/__tests__/components/ |
| FastAPI endpoints | pytest + httpx | backend/tests/ |
| Flujos completos | Playwright | tests/e2e/ |

## Setup inicial (si no existe)
```bash
# Frontend
cd apps/web
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom

# Backend
pip install pytest pytest-asyncio pytest-cov httpx
```

## Mock de Supabase (reutilizable)
```typescript
// apps/web/__tests__/mocks/supabase.ts
import { vi } from 'vitest'
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-uid', email: 'test@test.com' } }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-uid' } } }, error: null }),
  },
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
}
vi.mock('@/lib/supabase/client', () => ({ createClient: () => mockSupabaseClient }))
vi.mock('@/lib/supabase/server', () => ({ createServerClient: () => mockSupabaseClient }))
```

## Patrón unit test
```typescript
import { describe, it, expect } from 'vitest'
import { nombreFuncion } from '@/lib/utils/nombre'
describe('nombreFuncion', () => {
  it('debe [resultado esperado] cuando [condición]', () => {
    expect(nombreFuncion(input)).toBe(valorEsperado)
  })
  it('debe manejar [caso borde]', () => {
    expect(() => nombreFuncion(inputInvalido)).toThrow('mensaje esperado')
  })
})
```

## Patrón pytest (backend)
```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_endpoint_sin_auth():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/endpoint", json={})
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_endpoint_con_auth(mock_user):
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/endpoint",
                                  json={"campo": "valor"},
                                  headers={"Authorization": "Bearer test-token"})
    assert response.status_code == 201
```

## Verificación de coverage
```bash
cd apps/web && npx vitest run --coverage 2>&1 | grep "All files"
cd backend && python -m pytest tests/ --cov=. --cov-report=term-missing 2>&1 | tail -10
```

## Reporte de entrega
```
## Tests generados: [Feature]
- Archivos creados: [lista con N tests cada uno]
- Coverage: Frontend [X]% · Backend [X]%
- E2E: [flujos cubiertos]
- Todos los tests pasan: SI/NO
```
SKILLEOF

# ── SKILL GLOBAL: git-workflow ────────────────────────────────
mkdir -p "$SKILLS_DIR/git-workflow"
cat > "$SKILLS_DIR/git-workflow/SKILL.md" << 'SKILLEOF'
---
name: git-workflow
description: Gestión profesional de Git. Usar cuando el usuario dice "hacé commit", "guardá cambios", "push", "creá una PR", "commiteá", o al completar un módulo. Genera commits semánticos en español, verifica que no se suban archivos sensibles, y crea PR descriptions. Stack: GitHub, conventional commits.
---

# Git Workflow

## Verificaciones de seguridad (SIEMPRE primero)
```bash
git status
git diff --cached --name-only | grep -E "\.env|\.env\.local|\.env\.production"
grep -E "\.env\.local|\.env\*" .gitignore || echo "ATENCION: .env no está en .gitignore"
```
Si aparece algún archivo sensible → DETENER y alertar antes de continuar.

## Análisis de cambios
```bash
git diff --cached --stat
git diff --cached -- . ':(exclude)package-lock.json' | head -200
```

## Formato de commit
```
tipo(scope): descripción en español, imperativo, max 72 chars

[cuerpo opcional: qué cambió y por qué]
[footer: refs a issues, breaking changes]
```

Tipos: feat · fix · refactor · test · docs · chore · style · ci · perf
Scopes: auth · db · api · ui · overlay · rag · payments · deploy · config · tests

Ejemplos correctos:
- feat(auth): agregar login con Google OAuth via Supabase
- fix(rag): corregir chunk size en PDFs grandes
- refactor(api): extraer validación a middleware compartido

## Ejecución
```bash
git add .
git status  # verificación final
git commit -m "tipo(scope): descripción"
git push origin $(git branch --show-current)  # si se pidió push
```

## Crear Pull Request
Descripción de PR:
```markdown
## ¿Qué hace este PR?
[2-3 oraciones del cambio]
## Cambios principales
- [cambio 1]
## Cómo testear
1. [paso 1]
2. Verificar que [resultado]
## Checklist
- [ ] Tests agregados
- [ ] Sin secretos en código
- [ ] Funciona en local
```

## Reporte del commit
```
Commit creado: tipo(scope): descripción
Archivos: N · +X / -Y líneas
Sin archivos sensibles: OK
Push: OK/NO
```
SKILLEOF

# ── SKILL GLOBAL: db-migration ───────────────────────────────
mkdir -p "$SKILLS_DIR/db-migration"
cat > "$SKILLS_DIR/db-migration/SKILL.md" << 'SKILLEOF'
---
name: db-migration
description: Crea y gestiona migraciones de Supabase. Usar cuando se necesita crear tablas, agregar índices, habilitar pgvector, crear políticas RLS, o cuando el usuario dice "crear tabla", "migración", "schema", "índice vectorial" o "política RLS". SQL válido para PostgreSQL 15+ con pgvector.
---

# DB Migration

## Convenciones
- Tablas: snake_case plural (users, knowledge_documents, session_transcripts)
- PKs: uuid DEFAULT gen_random_uuid()
- Timestamps: timestamptz DEFAULT now()
- User ref: uuid REFERENCES auth.users(id) ON DELETE CASCADE
- Vectores: vector(1536) para OpenAI text-embedding-3-small
- Archivo: YYYYMMDDHHMMSS_descripcion_corta.sql en supabase/migrations/

## Template tabla completa con RLS
```sql
CREATE TABLE IF NOT EXISTS public.[nombre] (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre      text        NOT NULL,
  descripcion text,
  estado      text        NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','inactivo')),
  metadata    jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_[nombre]_user_id ON public.[nombre](user_id);
CREATE INDEX idx_[nombre]_created_at ON public.[nombre](created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_[nombre]_updated_at BEFORE UPDATE ON public.[nombre]
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.[nombre] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "[nombre]_select" ON public.[nombre] FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "[nombre]_insert" ON public.[nombre] FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "[nombre]_update" ON public.[nombre] FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "[nombre]_delete" ON public.[nombre] FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.[nombre] IS '[descripción]';

-- ROLLBACK:
-- DROP TABLE IF EXISTS public.[nombre];
```

## Template tabla con embeddings pgvector
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id     uuid        NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  content         text        NOT NULL,
  chunk_index     integer     NOT NULL,
  embedding       vector(1536),
  metadata        jsonb       DEFAULT '{}',
  created_at      timestamptz DEFAULT now() NOT NULL
);

-- Índice HNSW para búsqueda semántica rápida
CREATE INDEX idx_document_chunks_embedding
  ON public.document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_document_chunks_user ON public.document_chunks(user_id);
CREATE INDEX idx_document_chunks_doc  ON public.document_chunks(document_id);

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chunks_select" ON public.document_chunks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chunks_insert" ON public.document_chunks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chunks_delete" ON public.document_chunks FOR DELETE USING (auth.uid() = user_id);

-- ROLLBACK:
-- DROP TABLE IF EXISTS public.document_chunks;
```

## Aplicar migration
```bash
supabase db push
# O en Supabase Dashboard → SQL Editor → ejecutar el SQL
```
SKILLEOF

# ── SKILL GLOBAL: api-spec ───────────────────────────────────
mkdir -p "$SKILLS_DIR/api-spec"
cat > "$SKILLS_DIR/api-spec/SKILL.md" << 'SKILLEOF'
---
name: api-spec
description: Genera y mantiene la especificación OpenAPI 3.1. Usar cuando se termina un conjunto de API routes, cuando el usuario dice "documentá la API", "generá el swagger", "OpenAPI spec", "qué endpoints tengo". Escanea rutas de Next.js App Router y FastAPI, genera spec completa con schemas, ejemplos y errores.
---

# API Spec Generator

## Proceso
```bash
# Descubrir API routes de Next.js
find apps/web/app/api -name "route.ts" | sort

# Descubrir endpoints FastAPI
grep -rn "@router\." backend/routers/ --include="*.py" | grep -E "get|post|put|delete|patch"
```

Para cada archivo, identificar: método HTTP, autenticación requerida, body schema, response shape, error codes.

## Template OpenAPI 3.1
```yaml
openapi: 3.1.0
info:
  title: Telepromt IA API
  version: 0.1.0
  description: API del SaaS Telepromt IA

servers:
  - url: http://localhost:8000
    description: Desarrollo local
  - url: https://[backend].railway.app
    description: Producción

components:
  securitySchemes:
    supabaseAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Error:
      type: object
      properties:
        error: { type: string }
  responses:
    Unauthorized:
      description: No autenticado
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
          example: { error: "Unauthorized" }

security:
  - supabaseAuth: []

paths:
  /health:
    get:
      summary: Healthcheck
      security: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              example: { status: "ok", version: "0.1.0" }
```

## Guardar
```bash
mkdir -p docs/api
# Escribir la spec generada en docs/api/openapi.yaml
```
SKILLEOF

echo "✅ 5 skills globales instaladas en $SKILLS_DIR"
```

---

## 0-E-11 · Skill de proyecto — /rag-pipeline

```bash
cat > .claude/skills/rag-pipeline/SKILL.md << 'SKILLEOF'
---
name: rag-pipeline
description: Pipeline RAG completo de Telepromt IA. Invocar cuando se trabaja en ingesta de documentos, generación de embeddings, búsqueda semántica con pgvector, o cuando el usuario dice "RAG", "embeddings", "base de conocimiento", "procesar documento" o "búsqueda semántica". Stack: OpenAI text-embedding-3-small (1536 dims) + pgvector HNSW en Supabase.
---

# RAG Pipeline — Telepromt IA

## Arquitectura
```
Documento (PDF/DOCX/MD) → Extracción texto → Chunking (600 tokens, 50 overlap)
→ Embeddings (OpenAI batch) → Supabase pgvector (HNSW) → Retrieval (cosine, top-5)
→ Claude API (streaming) → Respuesta en overlay
```

## 1. Extractor (backend/services/rag/extractor.py)
```python
import pdfplumber, mammoth
from pathlib import Path

async def extract_text(file_path: str, mime_type: str) -> str:
    path = Path(file_path)
    if mime_type == "application/pdf":
        parts = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text: parts.append(text)
        return "\n\n".join(parts).strip()
    elif "wordprocessingml" in mime_type:
        with open(path, "rb") as f:
            return mammoth.extract_raw_text(f).value.strip()
    return path.read_text(encoding="utf-8").strip()
```

## 2. Chunker (backend/services/rag/chunker.py)
```python
import re
from dataclasses import dataclass
from typing import List

@dataclass
class Chunk:
    content: str
    chunk_index: int

def chunk_text(text: str, max_tokens: int = 600, overlap_tokens: int = 50) -> List[Chunk]:
    sentences = re.split(r'(?<=[.!?])\s+', text.replace('\n\n', '. '))
    sentences = [s.strip() for s in sentences if s.strip()]
    chunks, current, idx = [], "", 0
    for sentence in sentences:
        candidate = (current + " " + sentence).strip()
        if len(candidate) // 4 > max_tokens and current:
            chunks.append(Chunk(content=current.strip(), chunk_index=idx))
            idx += 1
            words = current.split()
            current = " ".join(words[-(overlap_tokens//6):]) + " " + sentence
        else:
            current = candidate
    if current.strip():
        chunks.append(Chunk(content=current.strip(), chunk_index=idx))
    return chunks
```

## 3. Embeddings (backend/services/rag/embeddings.py)
```python
from openai import AsyncOpenAI
import os
client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

async def embed_texts(texts: list[str]) -> list[list[float]]:
    all_embs = []
    for i in range(0, len(texts), 100):
        batch = [t.replace("\n", " ") for t in texts[i:i+100]]
        resp = await client.embeddings.create(model="text-embedding-3-small", input=batch)
        all_embs.extend([item.embedding for item in resp.data])
    return all_embs

async def embed_query(query: str) -> list[float]:
    return (await embed_texts([query]))[0]
```

## 4. Retrieval (backend/services/rag/retrieval.py)
```python
from .embeddings import embed_query
from dataclasses import dataclass

@dataclass
class RetrievedChunk:
    id: str; content: str; document_id: str; similarity: float

async def retrieve_chunks(supabase, query: str, user_id: str,
                           threshold: float = 0.7, count: int = 5) -> list[RetrievedChunk]:
    embedding = await embed_query(query)
    result = await supabase.rpc("search_documents", {
        "query_embedding": embedding, "match_threshold": threshold,
        "match_count": count, "p_user_id": user_id
    }).execute()
    return [RetrievedChunk(id=r["id"], content=r["content"],
                            document_id=r["document_id"], similarity=r["similarity"])
            for r in (result.data or [])]
```

## 5. Generator con streaming (backend/services/llm/generator.py)
```python
import anthropic, os
from typing import AsyncGenerator
claude = anthropic.AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM = """Sos el asistente de {name}, {role}, aplicando en {company}.
IDIOMA: Respondé SIEMPRE en {language}. Traducí internamente el CV si es necesario.
PERFIL: {context}
REGLAS: Profesional senior en entrevista real. 30-90 seg al leer. Estructura STAR cuando corresponda.
Nunca inventar métricas. Natural y hablado, no documento escrito."""

async def generate_stream(question: str, chunks: list, config: dict) -> AsyncGenerator[str, None]:
    context = "\n\n".join(f"[Fuente {i+1}]\n{c.content}" for i, c in enumerate(chunks)) \
              if chunks else "Sin información específica en la base de conocimiento."
    async with claude.messages.stream(
        model="claude-sonnet-4-5", max_tokens=400,
        system=SYSTEM.format(**config, context=context),
        messages=[{"role": "user", "content": question}]
    ) as stream:
        async for text in stream.text_stream:
            yield text
    yield f"\n[source:{'knowledge_base' if chunks else 'general'}]"
```

## Debugging
```sql
-- pgvector habilitado?
SELECT extname FROM pg_extension WHERE extname = 'vector';
-- Chunks del usuario
SELECT COUNT(*), document_id FROM document_chunks WHERE user_id = '[uid]' GROUP BY document_id;
-- Dimensiones correctas (1536)
SELECT array_length(embedding::float[], 1) FROM document_chunks LIMIT 3;
```
SKILLEOF
echo "✅ Skill de proyecto rag-pipeline creada"
```


## 0-E-12 · Slash commands (.claude/commands/)

```bash
# ── COMMAND: /nueva-feature ───────────────────────────────────
cat > .claude/commands/nueva-feature.md << 'CMDEOF'
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
9. `testing-specialist` → suite completa, coverage ≥ 80%
10. `reviewer` → code review del diff
11. `security-specialist` → audit (obligatorio si toca auth/pagos/datos usuario)

**FASE 6 — Cierre**
12. `judge` → validar criterios de aceptación
13. Si INCOMPLETO → volver al agente indicado
14. Si COMPLETO → skill `/git-workflow` para commit semántico
CMDEOF

# ── COMMAND: /pre-deploy ────────────────────────────────────
cat > .claude/commands/pre-deploy.md << 'CMDEOF'
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
- Tests pasan · Coverage ≥ 80% · Build limpio · Sin secretos · Sin issues críticos de seguridad

Si COMPLETO → invocar `release-manager`.
CMDEOF

# ── COMMAND: /post-deploy ───────────────────────────────────
cat > .claude/commands/post-deploy.md << 'CMDEOF'
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
CMDEOF

# ── COMMAND: /sprint-review ─────────────────────────────────
cat > .claude/commands/sprint-review.md << 'CMDEOF'
---
description: Revisa el estado del sprint actual vs el roadmap del CLAUDE.md. Usar al final de cada semana.
---
# /sprint-review

```bash
echo "=== Commits del sprint (últimas 2 semanas) ==="
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

### Métricas: N/M features · Coverage X% · Tests: N
### Próximas acciones: [acción — agente responsable]
### Riesgos: [riesgo — mitigación]
```

Actualizar [x] en CLAUDE.md para features completadas.
CMDEOF

# ── COMMAND: /debug ─────────────────────────────────────────
cat > .claude/commands/debug.md << 'CMDEOF'
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
| Síntoma | Capa | Agente |
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
CMDEOF

echo "✅ 5 slash commands creados"
```

---

## 0-E-13 · Verificación final del setup de Claude Code

```bash
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Verificación del setup de Claude Code              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

echo "── Agentes (.claude/agents/) ──"
ls .claude/agents/*.md 2>/dev/null | wc -l | xargs -I{} echo "{} agentes encontrados (esperado: 15)"
ls .claude/agents/*.md 2>/dev/null | sed 's|.claude/agents/||' | sed 's|.md||'

echo ""
echo "── Slash commands (.claude/commands/) ──"
ls .claude/commands/*.md 2>/dev/null | wc -l | xargs -I{} echo "{} commands (esperado: 5)"

echo ""
echo "── Skills de proyecto (.claude/skills/) ──"
ls .claude/skills/*/SKILL.md 2>/dev/null | sed 's|.claude/skills/||' | sed 's|/SKILL.md||'

echo ""
echo "── Skills globales (~/.claude/skills/) ──"
ls "$HOME/.claude/skills"/*/SKILL.md 2>/dev/null | sed "s|$HOME/.claude/skills/||" | sed 's|/SKILL.md||'

echo ""
echo "── Hooks (.claude/settings.json) ──"
[ -f .claude/settings.json ] && echo "settings.json presente" || echo "FALTA settings.json"

echo ""
echo "── Scripts ──"
ls scripts/*.sh 2>/dev/null | sed 's|scripts/||'

echo ""
echo "── Archivos raíz ──"
for f in CLAUDE.md CHANGELOG.md .gitignore .env.example; do
  [ -f "$f" ] && echo "OK: $f" || echo "FALTA: $f"
done

echo ""
echo "✅ Setup de Claude Code completo"
echo "Ejecutar /agents en Claude Code para confirmar que todos están cargados"
```

**⏸️ CHECKPOINT:** Verificar que hay 15 agentes, 5 commands, 5 skills globales, 1 skill de proyecto.
Ejecutar `/agents` en Claude Code y confirmar la lista completa. Decí "setup ok" para arrancar el desarrollo.

---

# FASE 1 — WEB APP BASE (Sprint 1-2)

> **Claude Code:** Iniciar Sprint 1-2 con el equipo de agentes. Usar el CLAUDE.md para contexto.
> No pausar entre agentes salvo error bloqueante. Reportar al final el estado de cada feature.

```
Iniciar Sprint 1-2. Ejecutar en orden:
1. product-lead → Feature Spec para Auth + Dashboard (F01, F02)
2. planner → tabla de subtareas del sprint
3. architect → schema SQL + contratos API + briefs técnicos
4. database-specialist → migration inicial (users, user_profiles, credit_transactions)
5. auth-specialist → Supabase Auth + middleware Next.js + RLS
6. backend + frontend (paralelo) → Auth pages + Dashboard UI
7. devops → GitHub Actions CI/CD + Vercel + Railway
8. testing-specialist → tests del sprint (coverage ≥ 80%)
9. security-specialist → audit pre-deploy
10. release-manager → release v0.1.0 → deploy-validator
```

**Features del Sprint 1-2:**
- F01: Auth completa (email+password + Google OAuth + JWT middleware + RLS)
- F02: Dashboard base (créditos + onboarding + perfil + download desktop placeholder)
- F03: CI/CD (GitHub Actions lint+test+deploy en cada push a main)

**⏸️ CHECKPOINT:** Verificar que el login funciona en la URL de Vercel. Decí "sprint 1-2 ok".

---

# FASE 2 — DESKTOP APP OVERLAY WINDOWS (Sprint 3)

> **Claude Code:** Desktop app Tauri v2 EXCLUSIVAMENTE para Windows.
> NUNCA generar código macOS, CoreAudio, DMG ni rutas de macOS.

```
Iniciar Sprint 3 — Desktop App Windows. Ejecutar en orden:
1. architect → ADR del overlay Tauri v2 + 5 features de invisibilidad
2. frontend → UI React del overlay (transcripción + respuesta IA + controles)
3. backend → protocolo telepromt:// para login desde browser
4. devops → pipeline build .exe con GitHub Actions + NSIS

Las 5 features de invisibilidad son OBLIGATORIAS:
1. SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE) — invisible en screen share
2. skipTaskbar: true — invisible en barra de tareas Windows
3. Proceso renombrado a 'pmodule' — invisible en task manager
4. setIgnoreMouseEvents selectivo — invisible al cambiar tabs
5. CSS cursor: none en el overlay — cursor undetectable

Atajos de teclado globales (Windows):
Ctrl+Enter=AI Answer · Ctrl+H=Hide/Show · Ctrl+Shift+Flechas=Mover
Ctrl+←/→=Navegar respuestas · Ctrl+Backspace=Limpiar
```

**⏸️ CHECKPOINT — TEST CRÍTICO:**
Abrir Zoom → compartir pantalla completa → verificar que el overlay NO aparece en la pantalla del otro lado. Decí "overlay ok".

---

# FASE 3 — AUDIO + IA EN TIEMPO REAL (Sprint 4-5)

> **Claude Code:** Pipeline completo audio → STT → detección → respuesta.
> Usar skill /rag-pipeline para el pipeline de embeddings y retrieval.

```
Iniciar Sprints 4-5 — Motor IA en tiempo real. Ejecutar en orden:
1. backend → Captura WASAPI loopback (audio sistema Windows, sin guardar)
2. backend → VAD (Voice Activity Detection) + Deepgram Nova-2 streaming
3. backend → Detección de idioma automática (ES/EN)
4. backend → Clasificador de preguntas (Claude Haiku — bajo costo)
5. backend + /rag-pipeline → RAG sobre CV del usuario
6. backend → Generación con Claude Sonnet + streaming de tokens
7. frontend → UI real-time overlay (WebSocket client en Tauri)
8. testing-specialist → tests de latencia end-to-end

Reglas de idioma OBLIGATORIAS (no relajar nunca):
- Detectar idioma de la pregunta automáticamente
- Responder SIEMPRE en el mismo idioma de la pregunta
- Si el CV está en español y la pregunta en inglés → traducir internamente el CV
- NUNCA mezclar idiomas en una respuesta

Latencias objetivo:
- Audio → texto visible en overlay: < 1.5 segundos
- Pregunta detectada → primer token visible: < 3 segundos
- Audio → respuesta completa visible: < 4 segundos

El audio NUNCA se graba ni se envía a servidores. Solo en memoria.
```

**⏸️ CHECKPOINT — TEST END-TO-END:**
Hablar en voz alta: "Tell me about your experience with Python"
Verificar: texto aparece en < 2s · se detecta como pregunta · respuesta en inglés usando info del CV.
Decí "audio IA ok".

---

# FASE 4 — SAAS COMPLETO + PAGOS (Sprint 6)

> **Claude Code:** Sistema de créditos completo con Mercado Pago.

```
Iniciar Sprint 6 — Mercado Pago + sistema de créditos. Ejecutar en orden:
1. architect → diseño del sistema de créditos + webhooks
2. database-specialist → tabla credit_transactions con mp_payment_id
3. backend → Checkout Pro Mercado Pago + webhooks con verificación de firma
4. backend → sistema de deducción: 0.5 créditos / 30 min, auto-extend a los 30s
5. frontend → billing page + UI del timer en overlay
6. auth-specialist → verificación de firma en webhooks
7. testing-specialist → tests pagos + flujo de créditos
8. security-specialist → audit especial de webhooks
9. release-manager → release v0.2.0

Reglas del sistema de créditos:
- Crear sesión NO consume créditos — solo activarla
- Sesión gratuita: 10 minutos sin costo
- Sesión paga: 0.5 créditos / 30 min, auto-extiende al llegar a 30s restantes
- Desconexión limpia si no hay créditos
- Saldo visible en tiempo real en overlay y dashboard
```

**⏸️ CHECKPOINT — TEST DE PAGOS:**
Usar tarjetas de prueba de Mercado Pago. Verificar: pago procesado → saldo actualizado → timer descuenta correctamente.
Decí "pagos ok".

---

# FASE 5 — QA + BUILD .EXE + LANZAMIENTO (Sprint 7-8)

> **Claude Code:** Suite completa de tests, build del instalador Windows, beta y launch.

```
Sprint 7 — QA + Build instalador Windows:

1. testing-specialist → suite completa (unit + integration + E2E, coverage ≥ 70%)
2. Optimizaciones: ajustar VAD para reducir consumo API, revisar prompts
3. devops → build .exe con NSIS via GitHub Actions (tag vX.X.X)
4. devops → configurar Tauri updater para auto-updates futuros
5. devops → publicar .exe en GitHub Releases + actualizar link en dashboard

Sprint 8 — Beta + Go Live:

6. Preparar para 3-5 usuarios beta
   Si hay bugs reportados, traerlos con: /debug [descripción del bug]
7. security-specialist → audit final pre-launch
8. release-manager → release v1.0.0 → tag → merge → deploy
9. deploy-validator → verificar producción con smoke-test.sh
```

**⏸️ CHECKPOINT FINAL:**
```bash
bash scripts/smoke-test.sh \
  "https://[tu-proyecto].vercel.app" \
  "https://[tu-backend].railway.app"
```
Si todos los checks son OK → ¡LANZAMIENTO PÚBLICO! Decí "go live".

---

# REFERENCIA RÁPIDA

```bash
# Desarrollo local
cd apps/web && npm run dev           # Web app → localhost:3000
cd backend && uvicorn main:app --reload --port 8000
cd apps/desktop && npm run tauri dev

# Tests
cd apps/web && npm test              # Frontend
cd backend && python -m pytest -v    # Backend
cd apps/web && npm run test:e2e      # Playwright

# Deploy (automático al hacer push a main)
git push origin main

# Supabase migrations
supabase db push                     # Aplicar migrations pendientes
supabase migration new [nombre]      # Nueva migration

# Slash commands de Claude Code
/nueva-feature [descripción]  → pipeline completo de feature
/pre-deploy                   → checklist antes de merge a main
/post-deploy                  → smoke tests en producción
/sprint-review                → estado del sprint vs roadmap
/debug [error]                → debugging estructurado
```

---

# COSTOS REALES

| Servicio | Setup único | Dev/mes | Prod/mes |
|---|---|---|---|
| Anthropic API | $20 | $10-25 | $10-30 |
| OpenAI (embeddings) | $5 | $1-3 | $1-5 |
| Deepgram Nova-2 | $0 ($200 gratis) | $0 | $0.006/min audio |
| Tavily | $0 | $0 | $0-20 |
| Railway (backend) | $0 ($5 gratis) | $5 | $5-15 |
| Vercel + Supabase + GitHub | $0 | $0 | $0 |
| Mercado Pago | $0 | $0 | 3.49% por venta |
| **TOTAL** | **~$25 USD** | **~$15-35 USD** | **~$30-80 USD** |

---

# REGLAS DE ORO

1. Commits frecuentes — Claude Code commitea después de cada módulo funcional
2. Una fase = una verificación — no avanzar si el checkpoint falla
3. Describir errores en lenguaje simple: "el overlay aparece en la pantalla del entrevistador"
4. Si algo falla 3 veces: usar `/debug [error]` para análisis de causa raíz
5. Vos sos el Product Owner — decidís QUÉ. Los agentes deciden CÓMO.

---

*Telepromt IA · SETUP.md Opción B (autocontenido) · v1.0*
*Basado en PRD v2.2 y Guía SuperAgente v5 · Sin dependencias externas*
*De cero a lanzamiento en ~8 semanas · Costo inicial: ~$25 USD*
