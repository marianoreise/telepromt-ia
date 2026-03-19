# Feature Spec: Sesion Gratuita (10 minutos)
**ID:** F05 | **Fecha:** 2026-03-19 | **Estado:** Draft

## Objetivo
Permitir que cualquier usuario autenticado inicie una sesion de asistencia IA de 10 minutos sin consumir creditos, validando el flujo completo de crear, temporizar y cerrar sesiones.

## User Stories

**US-01:** Como usuario autenticado, quiero iniciar una sesion gratuita de 10 minutos indicando empresa y puesto, para recibir asistencia IA en mi videollamada sin necesidad de comprar creditos.

**US-02:** Como usuario en sesion activa, quiero ver un temporizador regresivo en pantalla, para saber cuanto tiempo me queda antes de que la sesion termine.

**US-03:** Como usuario en sesion activa, quiero poder cerrar la sesion manualmente antes de que termine el tiempo, para finalizar cuando ya no necesite asistencia.

## Flujo de pantallas

### Pantalla 1 — Lista de sesiones (`/sessions`)
- Tabla/lista con historial de sesiones previas (company, job_title, status, fecha, duracion)
- Boton primario "Nueva sesion" en la parte superior
- Si hay una sesion activa, mostrar banner con enlace para volver a ella
- Estado vacio: mensaje "No tienes sesiones aun. Inicia tu primera sesion gratuita."

### Pantalla 2 — Modal/formulario "Nueva sesion"
- Campo `company` (texto, requerido, max 100 caracteres)
- Campo `job_title` (texto, requerido, max 100 caracteres)
- Boton "Iniciar sesion" (deshabilitado hasta completar ambos campos)
- Boton "Cancelar"
- Si ya existe una sesion activa: mostrar error inline, no permitir crear otra

### Pantalla 3 — Sesion activa (`/sessions/[id]`)
- Header: empresa + puesto
- Temporizador regresivo grande y visible: `MM:SS` (inicia en 10:00)
- Indicador de estado: "Sesion activa" (badge verde)
- Boton "Finalizar sesion" (con confirmacion)
- Al llegar a 1:00, el temporizador cambia a color rojo/advertencia
- Al llegar a 0:00: cierre automatico, redireccion a pantalla de resumen

### Pantalla 4 — Resumen post-sesion (`/sessions/[id]` con status completed)
- Datos: empresa, puesto, duracion real, fecha/hora inicio y fin
- Badge de estado: "Completada" / "Finalizada manualmente"
- Boton "Volver a sesiones"

## API Endpoints (FastAPI)

### `POST /api/v1/sessions`
- Body: `{ company: string, job_title: string }`
- Validaciones: usuario autenticado, no tener sesion activa
- Crea registro en `sessions` con status='active', started_at=now(), credits_used=0
- Response 201: `{ id, company, job_title, status, started_at, duration_limit: 600 }`

### `GET /api/v1/sessions`
- Lista sesiones del usuario autenticado, ordenadas por started_at DESC
- Paginacion: limit/offset
- Response 200: `{ sessions: [...], total: number }`

### `GET /api/v1/sessions/{id}`
- Detalle de una sesion del usuario
- Response 200: `{ id, company, job_title, status, started_at, ended_at, duration_seconds }`

### `POST /api/v1/sessions/{id}/end`
- Cierre manual de sesion activa
- Calcula duration_seconds = now() - started_at
- Actualiza ended_at=now(), status='completed'
- Response 200: `{ id, status, duration_seconds, ended_at }`

### `POST /api/v1/sessions/{id}/expire` (interno / cron)
- Llamado por el backend cuando el temporizador llega a 0
- Misma logica que `/end` pero status='completed'
- Idempotente: si ya esta completada, retorna 200 sin cambios

## Datos requeridos

### Tabla `sessions` (ya existe)
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid FK | references auth.users |
| company | text NOT NULL | max 100 chars |
| job_title | text NOT NULL | max 100 chars |
| status | text NOT NULL | 'active' / 'completed' / 'expired' |
| started_at | timestamptz | set on creation |
| ended_at | timestamptz | set on close |
| duration_seconds | integer | calculated on close |
| credits_used | numeric | 0 para sesion gratuita |

### RLS policies requeridas
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id AND status = 'active'`

## Reglas de negocio

| # | Regla | Validacion |
|---|---|---|
| RN-01 | Sesion gratuita dura exactamente 10 minutos (600 segundos) | El backend rechaza extend; el frontend cuenta hasta 0 |
| RN-02 | Solo 1 sesion activa por usuario a la vez | CHECK en INSERT: `NOT EXISTS (SELECT 1 FROM sessions WHERE user_id = $1 AND status = 'active')` |
| RN-03 | credits_used = 0 para sesion gratuita | Hardcoded en creacion, no se descuenta de user_credits |
| RN-04 | El temporizador es client-side pero la expiracion es server-side | El frontend muestra el countdown; si el usuario cierra el browser, un job o la siguiente request valida si paso el tiempo y marca completed |
| RN-05 | duration_seconds se calcula como diferencia real entre started_at y ended_at | No se confia en el cliente para este valor |
| RN-06 | Cierre manual antes de 10 min: status='completed', duration_seconds = tiempo real transcurrido | El usuario puede volver a crear otra sesion despues |
| RN-07 | Sesion que supera 10 min sin cierre (browser cerrado): el backend detecta y marca completed | Validar en GET /sessions y en POST /sessions (cleanup de sesiones vencidas) |

## Criterios de Aceptacion

- [ ] CA-01: El usuario puede crear una sesion completando company y job_title; ambos campos son requeridos
- [ ] CA-02: Al crear sesion, se inserta registro en `sessions` con status='active', credits_used=0, started_at=now()
- [ ] CA-03: Si el usuario ya tiene una sesion activa, el sistema muestra error y no permite crear otra
- [ ] CA-04: La pantalla de sesion activa muestra un temporizador regresivo de 10:00 a 0:00
- [ ] CA-05: Al llegar a 0:00, la sesion se cierra automaticamente: status='completed', ended_at y duration_seconds se calculan server-side
- [ ] CA-06: El usuario puede cerrar la sesion manualmente en cualquier momento con boton "Finalizar sesion" + confirmacion
- [ ] CA-07: La pagina `/sessions` muestra el historial de sesiones con company, job_title, status, duracion y fecha
- [ ] CA-08: RLS activo: un usuario solo puede ver y modificar sus propias sesiones
- [ ] CA-09: El endpoint POST /api/v1/sessions responde en menos de 500ms
- [ ] CA-10: El temporizador cambia a color de advertencia (rojo) cuando queda 1 minuto o menos
- [ ] CA-11: Si el usuario cierra el browser con sesion activa, la proxima vez que acceda o el backend detecte el vencimiento, la sesion se marca como completed
- [ ] CA-12: Toda la interfaz esta en espanol

## Fuera de scope
- Captura de audio y transcripcion (F04 overlay + Sprint 4-5 audio pipeline)
- Extension de sesion con creditos / auto-extend (feature de sesion paga)
- Sesiones de pago (0.5 creditos / 30 min) — sera feature separada
- Historial con filtros avanzados o busqueda
- Notificaciones push o email al terminar sesion
- Grabacion o persistencia de audio en servidores
- Resumen IA post-sesion

## Notas para el architect
- El temporizador es client-side (setInterval) con la fuente de verdad en `started_at` del servidor. Al cargar la pagina, calcular tiempo restante como `600 - (now - started_at)`.
- Implementar un middleware o check en el backend que al consultar una sesion activa cuyo started_at + 600s < now(), la marque automaticamente como completed (lazy expiration).
- No usar WebSocket solo para el temporizador; el countdown es local. WebSocket se reserva para el flujo de audio/STT en sprints futuros.
- RLS es obligatorio desde la migracion. No confiar en filtros de aplicacion unicamente.
- El router de sessions en FastAPI debe ir en `backend/routers/sessions.py`.

## Metricas de exito en produccion
- El 90% de los usuarios que hacen clic en "Nueva sesion" completan el formulario y la inician
- Menos del 2% de sesiones quedan en status='active' mas de 15 minutos (indica fallo en auto-cierre)
- Latencia promedio de POST /sessions < 300ms (p95 < 500ms)
- Cero sesiones con user_id que no coincida con el usuario autenticado (validacion RLS)
