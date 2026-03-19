# Feature Spec: Desktop App Overlay Windows
**ID:** F04 | **Fecha:** 2026-03-18 | **Estado:** Aprobado

## Objetivo
App desktop Windows que muestra respuestas IA como teleprompter, completamente invisible para los participantes de la videollamada.

## Criterios de Aceptación
- [ ] CA-01: Overlay invisible en screen share de Zoom/Meet/Teams (WDA_EXCLUDEFROMCAPTURE)
- [ ] CA-02: No aparece en barra de tareas de Windows (skipTaskbar)
- [ ] CA-03: Proceso aparece como 'pmodule' en Task Manager
- [ ] CA-04: Al cambiar de tab el overlay no interfiere con el mouse (setIgnoreMouseEvents)
- [ ] CA-05: Cursor invisible sobre el overlay (CSS cursor: none)
- [ ] CA-06: Atajos globales funcionan: Ctrl+Enter · Ctrl+H · Ctrl+Shift+Flechas
- [ ] CA-07: Login desde browser via protocolo telepromt://
- [ ] CA-08: UI muestra transcripción y respuesta IA en tiempo real

## Las 5 features de invisibilidad (OBLIGATORIAS)
1. SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE) — invisible en screen share
2. skipTaskbar: true — invisible en barra de tareas
3. Proceso renombrado a 'pmodule' — invisible en task manager
4. setIgnoreMouseEvents selectivo — no interfiere al cambiar tabs
5. CSS cursor: none — cursor undetectable en el overlay
