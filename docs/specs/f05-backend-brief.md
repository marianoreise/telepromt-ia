# Brief técnico — Backend: F05 Sesión Gratuita

**Archivo a modificar:** `backend/routers/sessions.py`
**Fecha:** 2026-03-19

---

## Contexto del módulo existente

El router ya provee:
- `GET /sessions/balance` — saldo de créditos
- `GET /sessions/` — historial paginado

Ambos usan `_get_supabase()` (service role) y `get_current_user` (JWT via ANON key).
Este brief agrega tres endpoints nuevos manteniendo el mismo patrón.

---

## Constantes a agregar al módulo

```python
FREE_SESSION_SECONDS: int = 600  # 10 minutos
```

---

## Modelos Pydantic v2 nuevos

### `SessionCreateRequest`
```python
class SessionCreateRequest(BaseModel):
    company:   str = Field(..., min_length=1, max_length=200)
    job_title: str = Field(..., min_length=1, max_length=200)
```

### `SessionDetail`
```python
class SessionDetail(BaseModel):
    id:           str
    started_at:   str
    ended_at:     str | None
    duration_sec: int | None
    credits_used: float
    company:      str
    job_title:    str
    status:       str
    # Campo calculado, no guardado en DB
    seconds_remaining: int | None  # None si status != 'active'
```

### `SessionEndResponse`
```python
class SessionEndResponse(BaseModel):
    id:           str
    status:       str          # 'ended'
    duration_sec: int
    credits_used: float
```

---

## Endpoints nuevos

### POST /sessions

**Propósito:** Crear una nueva sesión gratuita de 10 minutos.

**Autenticación:** `get_current_user` (Bearer JWT)

**Lógica paso a paso:**

1. Verificar que el usuario NO tenga una sesión con `status = 'active'`.
   - Query: `sessions.select("id").eq("user_id", user.id).eq("status", "active").execute()`
   - Si existe → `raise HTTPException(status_code=409, detail="Ya existe una sesión activa")`
   - Incluir en el detalle el `id` de la sesión activa para que el frontend pueda redirigir.

2. Insertar la sesión con `status = 'active'`, `credits_used = 0`, `company` y `job_title` del request.
   - Usar service role client (no RLS, porque el trigger de BD ya valida).

3. Devolver `SessionDetail` con `seconds_remaining = FREE_SESSION_SECONDS`.

**Response:** `201 Created` con `SessionDetail`.

**Errores:**
- `409` — sesión activa ya existente (incluir `active_session_id` en el body)
- `422` — validación Pydantic (company/job_title vacíos)

---

### GET /sessions/{session_id}

**Propósito:** Obtener detalle de una sesión + aplicar expiración lazy.

**Autenticación:** `get_current_user`

**Parámetro de ruta:** `session_id: str` (UUID)

**Lógica paso a paso:**

1. Fetch de la sesión por `id` y `user_id` (validar ownership).
   - Si no existe o no pertenece al usuario → `404`.

2. Si `status == 'active'`, calcular `seconds_elapsed`:
   ```
   seconds_elapsed = (now_utc - started_at).total_seconds()
   seconds_remaining = max(0, FREE_SESSION_SECONDS - seconds_elapsed)
   ```

3. **Expiración lazy:** Si `seconds_remaining == 0` y `status == 'active'`:
   - Calcular `duration_sec = min(int(seconds_elapsed), FREE_SESSION_SECONDS)`
   - Hacer UPDATE en DB: `status = 'expired'`, `ended_at = now()`, `duration_sec = duration_sec`
   - Devolver la sesión ya con `status = 'expired'` y `seconds_remaining = None`.

4. Si `status != 'active'`, `seconds_remaining = None`.

**Response:** `200` con `SessionDetail`.

**Errores:**
- `404` — sesión no encontrada o no pertenece al usuario

**Nota de implementación:** Usar `datetime.now(timezone.utc)` para el cálculo. El `started_at` que devuelve Supabase es una string ISO 8601 con timezone; parsear con `datetime.fromisoformat()`.

---

### POST /sessions/{session_id}/end

**Propósito:** Cierre manual de sesión por parte del usuario.

**Autenticación:** `get_current_user`

**Parámetro de ruta:** `session_id: str` (UUID)

**Lógica paso a paso:**

1. Fetch de la sesión (`id`, `user_id`, `status`, `started_at`).
   - Si no existe o no es del usuario → `404`.
   - Si `status != 'active'` → `409` con `detail: "La sesión ya fue cerrada"`.

2. Calcular `duration_sec`:
   ```
   seconds_elapsed = (now_utc - started_at).total_seconds()
   duration_sec = min(int(seconds_elapsed), FREE_SESSION_SECONDS)
   ```

3. UPDATE en DB:
   - `status = 'ended'`
   - `ended_at = now()`
   - `duration_sec = duration_sec`
   - `credits_used = 0` (sesión gratuita; créditos se consumirán en Sprint 6)

4. Devolver `SessionEndResponse`.

**Response:** `200` con `SessionEndResponse`.

**Errores:**
- `404` — sesión no encontrada
- `409` — sesión ya cerrada

---

## Actualización de `SessionSummary` (modelo existente)

Agregar los campos `company`, `job_title`, `status` al modelo existente y al SELECT del `GET /sessions/`:

```python
class SessionSummary(BaseModel):
    id:           str
    started_at:   str
    ended_at:     str | None
    duration_sec: int | None
    credits_used: float
    company:      str       # nuevo
    job_title:    str       # nuevo
    status:       str       # nuevo
```

Actualizar el `.select(...)` en `list_sessions` para incluir estas columnas.

---

## Imports adicionales necesarios

```python
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
```

---

## Manejo de errores 409 con contexto

Para el conflicto de sesión activa, usar un body estructurado:
```python
raise HTTPException(
    status_code=409,
    detail={
        "message": "Ya existe una sesión activa",
        "active_session_id": str(existing_row["id"])
    }
)
```
Esto permite al frontend redirigir directamente al usuario a la sesión activa en lugar de mostrar un error genérico.

---

## Tests requeridos (80% cobertura mínima)

Archivo: `backend/tests/test_sessions.py`

Casos obligatorios:
- `POST /sessions` crea sesión cuando no hay activa
- `POST /sessions` devuelve 409 si ya hay sesión activa
- `POST /sessions` devuelve 422 si company o job_title están vacíos
- `GET /sessions/{id}` devuelve 404 para session de otro usuario
- `GET /sessions/{id}` expira lazy correctamente (mock `datetime.now`)
- `POST /sessions/{id}/end` cierra sesión activa y calcula duration_sec
- `POST /sessions/{id}/end` devuelve 409 en sesión ya cerrada
