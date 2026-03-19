# F06 — Rediseño completo de la app desktop ListnrIO

**Fecha:** 2026-03-19
**Estado:** En desarrollo
**Prioridad:** Alta

---

## Contexto

La app desktop actual es un overlay básico sin login, sin gestión de sesiones, y sin UI de creación de sesión. El rediseño convierte la app en una experiencia completa que replica la funcionalidad de la web pero en un widget flotante invisible durante screen share.

**Nombre del producto en desktop:** ListnrIO (nunca "Telepromt IA")
**Idioma de toda la UI:** Español

---

## Pantallas y flujo

### 1. Selector de plataforma (WEB — después de Crear Sesión)

Modal que aparece en la web app luego de crear una sesión exitosamente:

```
┌─────────────────────────────────┐
│  Elegir plataforma              │
│  ¿Cómo querés conectarte a tu   │
│  sesión?                        │
│                                 │
│  [🖥 App de escritorio] ← Recomendado  │
│                                 │
│     o  🌐 Abrir en el navegador │
│                                 │
│  📖 Escritorio vs Navegador     │
└─────────────────────────────────┘
```

- Botón "App de escritorio" abre el deep link `listnr://session/{session_id}`
- Botón "Abrir en el navegador" navega a `/sessions/{session_id}`

---

### 2. Pantalla de login (DESKTOP — sin sesión)

```
┌──────────────────────────────┐
│ 🦜 ListnrIO      ⊙ 0  ⋮ ⊕ ^ ✕│
│                              │
│        ListnrIO              │
│  Iniciá sesión para comenzar │
│  tu entrevista.              │
│                              │
│  [        Iniciar sesión    ]│
└──────────────────────────────┘
```

- Botón "Iniciar sesión" → abre la web dashboard en el navegador
- Si el usuario ya está logueado en la web → auth automática via deep link → app se loguea sola
- Si no → usuario inicia sesión en navegador → clic en "Permitir" → app recibe token

---

### 3. Pantalla principal (DESKTOP — autenticado)

```
┌──────────────────────────────────┐
│ 🦜 ListnrIO   ⊙ 27  ⋮  ⊕  ^  ✕  │
├──────────────────────────────────┤
│  [ Crear ]    [ Sesiones pasadas ]│
├──────────────────────────────────┤
│  Tipo de sesión  ⓘ               │
│  [ Sesión gratuita ] [ Sesión completa ] │
└──────────────────────────────────┘
```

**Header:**
- Logo ListnrIO (izquierda)
- Botón créditos (negro, ⊙ N monedas) → tooltip "Clic para comprar créditos"
- Botón ⋮ → menú desplegable (ver abajo)
- Botón ⊕ → activar modo mover ventana
- Botón ^ → colapsar a solo logo/soundwave
- Botón ✕ → cerrar y salir de la app

**Menú ⋮:**
- 👤 email@ejemplo.com
- 🔲 Dashboard (abre web en navegador)
- Next Screen → (mover a siguiente monitor)
- Privado ○ (toggle — activa screen capture exclusion)
- Zoom + − ↺
- [→ Cerrar sesión]

**Tooltip Sesión gratuita:**
> "Una sesión gratuita no usa créditos, pero tiene un límite de 10 minutos. No podrás crear otra sesión gratuita por los próximos 12 minutos."

**Tooltip Sesión completa:**
> "Las sesiones completas no gastan créditos al crearlas. Activar una sesión usará 0.5 de tus créditos de entrevista."

---

### 4. Creación de sesión — Paso 1 (DESKTOP)

```
┌──────────────────────────────────┐
│ 🦜 ListnrIO   ⊙ 27  ⋮  ⊕  ^  ✕  │
├──────────────────────────────────┤
│  [ Crear ]    [ Sesiones pasadas ]│
├──────────────────────────────────┤
│  Empresa  ⓘ                      │
│  [ Microsoft                   ] │
│                                  │
│  Descripción del puesto  ⓘ       │
│  [ Developer                   ] │
│                    ↕             │
│  [ Volver ]     [ Siguiente →  ] │
└──────────────────────────────────┘
```

---

### 5. Creación de sesión — Paso 2 (DESKTOP)

```
┌──────────────────────────────────┐
│ 🦜 ListnrIO   ⊙ 27  ⋮  ⊕  ^  ✕  │
├──────────────────────────────────┤
│  [ Crear ]    [ Sesiones pasadas ]│
├──────────────────────────────────┤
│  Idioma  ⓘ        Lenguaje simple ⓘ │
│  [ Inglés ▼ ]          [ ○    ]  │
│  Opciones: Castellano / Inglés / Cast/Eng │
│                                  │
│  Contexto / Instrucciones extra ⓘ│
│  [ Ser más técnico.            ] │
│                        ↕         │
│  📋 CV  ⓘ                         │
│  [ CV de Juan              ▼ ✕ ] │
│                                  │
│  🤖 Modelo IA  ⓘ                  │
│  [ Claude Sonnet  Recomendado  ] │
│                                  │
│  Generar respuestas automáticas ⓘ [ ○ ] │
│  Guardar transcripción  ⓘ       [ ● ] │
│                                  │
│  [ Volver ]  [ Crear sesión →  ] │
└──────────────────────────────────┘
```

**Selector de idioma:** 3 opciones — Castellano · Inglés · Cast/Eng

---

### 6. Confirmación / Activar sesión (DESKTOP)

```
┌──────────────────────────────────┐
│         Activar sesión           │
│  ⓘ Esta es una sesión gratuita   │
│  de 10 minutos.                  │
│  No podrás crear otra sesión     │
│  gratuita por los próximos 15    │
│  minutos.                        │
│                                  │
│  [🎬 Video entrevista mock]      │
│  También podés hacer screen share│
│  de una entrevista mock en YouTube│
│                                  │
│  [ Volver ]  [ Activar (Gratis) ]│
└──────────────────────────────────┘
```

---

### 7. Sesión activa — Barra de herramientas (DESKTOP overlay)

```
┌─────────────────────────────────────────────────────────┐
│ 🔊 📋 🎤  [ Respuesta IA ✨ ] [ Analizar pantalla 🖥 ] [ Chat ] ■ 7:45  ⋮  ⊕  ^  │
├─────────────────────────────────────────────────────────┤
│ [transcripción en tiempo real scrolleable...]    🗑  ∨  ✕│
└─────────────────────────────────────────────────────────┘
```

**Iconos de la barra:**
- 🔊 (soundwave animado) → mostrar/ocultar panel de transcripción
- 📋 → audio del sistema (ON por defecto, punto rojo = grabando)
- 🎤 → micrófono
- **Respuesta IA ✨** → solicitar respuesta IA
- **Analizar pantalla 🖥** → captura screenshot + pide respuesta IA
- **Chat** → abrir panel de chat manual
- **■ 7:45** → timer cuenta regresiva + stop (clic para detener sesión)
- ⋮ → menú con opciones adicionales durante sesión activa
- ⊕ → mover ventana
- ^ → colapsar a solo soundwave

**Menú ⋮ durante sesión activa (extras):**
- Todo lo del menú normal +
- Idioma (cambiar en caliente)
- Auto Generar (toggle)
- Salir sin finalizar ⓘ
- Finalizar sesión ⓘ

---

### 8. Panel de respuesta IA (DESKTOP)

```
┌─────────────────────────────────┐
│ ‹ ›                    🗑  ✕    │
│                                 │
│ ● Pregunta: ¿Por qué querés     │
│   trabajar en Microsoft?        │
│                                 │
│ ★ Respuesta:                    │
│ • Quiero trabajar en Microsoft  │
│   porque...                     │
│ • Mi experiencia en Java...     │
│                                 │
│                          ↔ ↕   │
└─────────────────────────────────┘
```

- Flechas ‹ › → navegar respuestas anteriores
- 🗑 → limpiar mensajes
- ✕ → cerrar panel
- Resize handle (esquina inf-derecha)

---

### 9. Panel de chat manual (DESKTOP)

Campo de texto → usuario escribe pregunta → "Enviar" → se procesa igual que voz

---

### 10. Modo colapsado (DESKTOP)

Al presionar ^ (Hide), toda la UI desaparece excepto:
- Solo el icono de soundwave animado (si hay sesión activa)
- O solo el logo ListnrIO (si no hay sesión activa)

Hacer clic en el icono → expande la app de vuelta

---

### 11. Sesiones pasadas (tab en DESKTOP)

Lista sincronizada con Supabase, mismos datos que la web:
- Empresa | Idioma | Estado | Tipo (Gratis/Completa) | Fecha

---

## Funcionalidades de invisibilidad (mantener)

1. WDA_EXCLUDEFROMCAPTURE → invisible en Zoom/Teams/OBS screen share
2. skipTaskbar: true → no aparece en barra de tareas
3. Nombre proceso: pmodule (ya configurado en Cargo.toml)
4. setIgnoreMouseEvents selectivo → mouse pasa a través cuando no se necesita
5. CSS transparent body

---

## Cambios en la web app

- **Modal "Elegir plataforma"** después de crear sesión exitosa
  - Botón "App de escritorio" → abre deep link `listnr://session/{id}`
  - Botón "Abrir en el navegador" → navega a la sesión
  - Link "Escritorio vs Navegador" → modal informativo

---

## Stack técnico para implementación

| Componente | Tecnología |
|---|---|
| UI desktop | React + TypeScript strict + estilos inline (sin CSS externo) |
| Auth deep link | `tauri-plugin-deep-link` + scheme `listnr://` |
| Token storage | `tauri-plugin-store` (keychain seguro) |
| Supabase client | `@supabase/supabase-js` en frontend React |
| WebSocket STT | Mantener protocolo actual |
| Captura de pantalla | `@tauri-apps/plugin-screenshot` o Rust nativo |

---

## Criterios de aceptación

- [ ] CA-01: Login via deep link funciona — usuario logueado en web → clic en app desktop → autenticado automáticamente
- [ ] CA-02: Pantalla principal muestra créditos reales del usuario
- [ ] CA-03: Creación de sesión en 2 pasos guarda en Supabase y sincroniza con web
- [ ] CA-04: Selector de idioma tiene 3 opciones: Castellano / Inglés / Cast-Eng
- [ ] CA-05: Sesión activa muestra timer correcto y para cuando llega a 0
- [ ] CA-06: "Analizar pantalla" captura screenshot y envía al backend
- [ ] CA-07: Modo colapsado (^) muestra solo soundwave o logo
- [ ] CA-08: Tab "Sesiones pasadas" muestra misma lista que la web app
- [ ] CA-09: La app es invisible en screen share (WDA_EXCLUDEFROMCAPTURE activo)
- [ ] CA-10: Toda la UI está en español — ningún string en inglés visible

---

## Auth — requisito de sesión web activa

**El desktop app requiere que el usuario esté logueado en la web app.**

El flujo completo:
1. Usuario abre el desktop app → ve pantalla de login
2. Hace clic en "Iniciar sesión" → se abre `https://listnr.io/dashboard` en el navegador
3. Si ya está logueado en la web → la web detecta que hay un desktop esperando y emite el deep link `listnr://auth?access_token=XXX&refresh_token=YYY` automáticamente
4. Si no está logueado → hace login en la web → luego la web emite el deep link
5. El desktop recibe el deep link → guarda los tokens → queda autenticado
6. A partir de ahí sincroniza: usuario, créditos, sesiones, CV/resume — todo via Supabase con los tokens recibidos

**Sin sesión web activa = desktop solo muestra pantalla de login.**

Este flujo garantiza un único sistema de auth (Supabase) compartido entre web y desktop.

## Notas de implementación

- Mantener invisibilidad durante screen share como prioridad 1
- El deep link scheme `listnr://` ya está registrado en tauri.conf.json
- El backend STT WebSocket ya implementado — mantener protocolo
- Diseñar para ventana ~420x600px redimensionable
- Fuente: Segoe UI (Windows nativa)
- Auth del desktop SIEMPRE via deep link desde la web — nunca implementar login nativo en el desktop
