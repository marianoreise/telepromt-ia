# Brief técnico — Frontend: F05 Sesión Gratuita

**Fecha:** 2026-03-19
**Stack:** Next.js 14 App Router · TypeScript strict · shadcn/ui · Tailwind
**Patrón de fetch:** directo a `NEXT_PUBLIC_API_URL` (FastAPI), sin API routes Next.js

---

## Tipos compartidos

Crear `apps/web/types/session.ts`:

```typescript
export type SessionStatus = 'active' | 'ended' | 'expired'

export interface SessionDetail {
  id: string
  started_at: string          // ISO 8601
  ended_at: string | null
  duration_sec: number | null
  credits_used: number
  company: string
  job_title: string
  status: SessionStatus
  seconds_remaining: number | null
}

export interface SessionSummary {
  id: string
  started_at: string
  ended_at: string | null
  duration_sec: number | null
  credits_used: number
  company: string
  job_title: string
  status: SessionStatus
}

export interface CreateSessionPayload {
  company: string
  job_title: string
}

// Respuesta 409 del backend cuando ya hay sesión activa
export interface ActiveSessionConflict {
  message: string
  active_session_id: string
}
```

---

## Hook: `useSessionTimer`

**Archivo:** `apps/web/hooks/useSessionTimer.ts`

**Propósito:** Cuenta regresiva en cliente basada en `seconds_remaining` inicial del servidor. Cada segundo hace tick. Cuando llega a 0 notifica al padre para que marque la sesión como expirada en la UI sin llamada extra al backend (el backend expira lazy en la próxima consulta).

**Firma:**
```typescript
interface UseSessionTimerOptions {
  initialSeconds: number       // seconds_remaining del GET /sessions/{id}
  onExpire: () => void         // callback cuando el timer llega a 0
}

interface UseSessionTimerResult {
  secondsLeft: number
  isExpired: boolean
  formattedTime: string        // "MM:SS" ej: "09:42"
}

export function useSessionTimer(
  options: UseSessionTimerOptions
): UseSessionTimerResult
```

**Implementación:**

- Estado interno: `secondsLeft` inicializado con `initialSeconds`.
- `useEffect` que crea un `setInterval` de 1000ms.
- En cada tick: decrementar `secondsLeft` en 1.
- Cuando `secondsLeft <= 0`: limpiar intervalo, llamar `onExpire()`.
- Limpiar intervalo en cleanup del efecto.
- `formattedTime`:
  ```typescript
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const secs = (secondsLeft % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
  ```
- `isExpired`: `secondsLeft <= 0`

**Importante:** No hacer fetch en el hook. El hook es solo un contador. El fetch de estado actual de la sesión es responsabilidad de la página.

---

## Página 1: Lista de sesiones

**Archivo:** `apps/web/app/(dashboard)/sessions/page.tsx`

**Tipo:** `'use client'` (necesita estado para el modal)

**Responsabilidades:**
1. Cargar lista de sesiones vía `GET /sessions/` al montar.
2. Detectar si hay una sesión activa en la lista (status === 'active') para mostrar botón "Continuar" en lugar de "Nueva sesión".
3. Abrir modal de nueva sesión.
4. Redirigir a `/sessions/{id}` tras crear o al continuar una sesión activa.

**Layout:**
```
[Header: "Sesiones"  |  Botón "Nueva sesión" o "Continuar sesión activa"]
[Lista de SessionCard]
[Modal: NuevaSessionModal]
```

**Componente `SessionCard`** (puede ser inline o en `components/sessions/`):
- Props: `session: SessionSummary`
- Muestra: badge de status (verde=active, gris=ended, naranja=expired), company + job_title, fecha, duración formateada en minutos:segundos si `duration_sec != null`.
- Si `status === 'active'`: badge pulsante + link a `/sessions/{id}`.
- Click en tarjeta navega a `/sessions/{id}`.

**Lógica del botón principal:**
```typescript
const activeSession = sessions.find(s => s.status === 'active')
// Si existe → botón "Continuar sesión activa" → router.push(`/sessions/${activeSession.id}`)
// Si no → botón "Nueva sesión" → setModalOpen(true)
```

**Estados de la página:**
```typescript
const [sessions, setSessions] = useState<SessionSummary[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [modalOpen, setModalOpen] = useState(false)
```

**Fetch de sesiones:**
```typescript
// En useEffect al montar
const token = /* obtener de supabase.auth.getSession() → access_token */
const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

---

## Componente: `NuevaSessionModal`

**Archivo:** `apps/web/components/sessions/NuevaSessionModal.tsx`

**Tipo:** `'use client'`

**Props:**
```typescript
interface NuevaSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionCreated: (session: SessionDetail) => void
}
```

**UI (shadcn/ui Dialog):**
```
<Dialog>
  <DialogHeader>Nueva sesión</DialogHeader>
  <DialogContent>
    <Input label="Empresa" placeholder="Google, Meta..." />
    <Input label="Puesto" placeholder="Senior Frontend Engineer..." />
    <p className="text-sm text-muted-foreground">
      Sesión gratuita: 10 minutos
    </p>
  </DialogContent>
  <DialogFooter>
    <Button variant="outline">Cancelar</Button>
    <Button type="submit" disabled={loading}>Iniciar sesión</Button>
  </DialogFooter>
</Dialog>
```

**Validación cliente:**
- `company.trim().length > 0` — sino deshabilitar submit y mostrar error inline.
- `job_title.trim().length > 0` — idem.

**Lógica de submit:**
1. POST a `/sessions/` con `{ company, job_title }`.
2. Si `201` → llamar `onSessionCreated(data)` → la página redirige a `/sessions/{id}`.
3. Si `409` → el backend devuelve `active_session_id`. Mostrar mensaje "Ya tienes una sesión activa" con botón "Ir a sesión activa" que navega a `/sessions/{active_session_id}`.
4. Si error de red → mostrar toast de error.

**Estado interno:**
```typescript
const [company, setCompany] = useState('')
const [jobTitle, setJobTitle] = useState('')
const [submitting, setSubmitting] = useState(false)
const [fieldErrors, setFieldErrors] = useState<{ company?: string; job_title?: string }>({})
```

---

## Página 2: Vista de sesión activa

**Archivo:** `apps/web/app/(dashboard)/sessions/[id]/page.tsx`

**Tipo:** `'use client'` (timer, estado de sesión)

**Props de ruta:**
```typescript
interface PageProps {
  params: { id: string }
}
```

**Responsabilidades:**
1. Cargar `GET /sessions/{id}` al montar.
2. Si `status !== 'active'` → mostrar vista de sesión terminada (resumen).
3. Si `status === 'active'` → mostrar temporizador usando `useSessionTimer`.
4. Polling cada 30 segundos a `GET /sessions/{id}` para sync con servidor (por si otra pestaña/dispositivo terminó la sesión).
5. Botón "Finalizar sesión" → `POST /sessions/{id}/end` → actualizar estado local → mostrar resumen.

**Estados:**
```typescript
const [session, setSession] = useState<SessionDetail | null>(null)
const [loading, setLoading] = useState(true)
const [ending, setEnding] = useState(false)
const [error, setError] = useState<string | null>(null)
```

**Layout (sesión activa):**
```
[Header con badge "EN VIVO" pulsante]

[Timer grande centrado]
  "09:42"
  "minutos restantes"

[Info: Empresa | Puesto]

[Barra de progreso: tiempo usado / 10 min]

[Botón "Finalizar sesión" variant="destructive" outline]
```

**Layout (sesión terminada/expirada):**
```
[Header: "Sesión finalizada"]
[Badge: "Completada" / "Expirada"]
[Stats: Duración | Empresa | Puesto | Fecha]
[Botón "Nueva sesión" → /sessions con modal abierto]
[Botón "Volver al historial" → /sessions]
```

**Integración con `useSessionTimer`:**
```typescript
// Solo montar el timer si la sesión está activa y tiene seconds_remaining
const { formattedTime, isExpired } = useSessionTimer({
  initialSeconds: session?.seconds_remaining ?? 0,
  onExpire: () => {
    // Actualizar estado local a expired sin fetch extra
    setSession(prev => prev ? { ...prev, status: 'expired', seconds_remaining: 0 } : null)
  }
})
```

**Polling:**
```typescript
useEffect(() => {
  if (!session || session.status !== 'active') return
  const interval = setInterval(async () => {
    const updated = await fetchSession(params.id, token)
    // Si el servidor cambió el status, sincronizar
    if (updated.status !== 'active') {
      setSession(updated)
    }
  }, 30_000)
  return () => clearInterval(interval)
}, [session?.status])
```

**Finalizar sesión (handler):**
```typescript
async function handleEndSession() {
  setEnding(true)
  try {
    const res = await fetch(`${API_URL}/sessions/${session.id}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Error al finalizar')
    const data = await res.json()
    setSession(prev => prev ? {
      ...prev,
      status: 'ended',
      duration_sec: data.duration_sec,
      ended_at: new Date().toISOString(),
      seconds_remaining: null
    } : null)
  } catch {
    // mostrar toast de error
  } finally {
    setEnding(false)
  }
}
```

---

## Helper de formato

Crear `apps/web/lib/format-duration.ts`:

```typescript
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}
```

---

## Variables de entorno necesarias

Ya existe: `NEXT_PUBLIC_API_URL` — sin cambios.

---

## Flujo completo usuario

```
/sessions (lista vacía)
  → click "Nueva sesión"
    → modal: llenar company + job_title
      → POST /sessions → 201
        → redirect /sessions/{id}
          → timer 10:00 empieza cuenta regresiva
            → usuario termina manualmente → POST /sessions/{id}/end
              → vista resumen con duración
            → ó timer llega a 0 → vista "sesión expirada"
```

---

## Notas de implementación

- El token JWT se obtiene en cliente con `supabase.auth.getSession()` — en el cliente esto es aceptable; las restricciones de `getSession()` aplican solo en Server Components/middleware.
- No usar `useRouter` dentro de `useSessionTimer` — el hook no sabe de routing.
- La barra de progreso: `value = ((600 - secondsLeft) / 600) * 100`.
- shadcn/ui a usar: `Dialog`, `Button`, `Input`, `Badge`, `Progress`, `Card`, `CardHeader`, `CardContent`, `CardFooter`.
