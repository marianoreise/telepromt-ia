'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useSessionTimer } from '@/hooks/useSessionTimer'
import { formatDuration } from '@/lib/format-duration'
import type { SessionDetail } from '@/types/session'
import Image from 'next/image'
import { ArrowLeft, Radio } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const FREE_SESSION_SECONDS = 600

async function getToken(): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

interface PageProps {
  params: { id: string }
}

export default function SessionDetailPage({ params }: PageProps) {
  const router = useRouter()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/sessions/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: SessionDetail = await res.json()
        setSession(data)
      } else if (res.status === 404) {
        setError('Sesión no encontrada')
      } else {
        setError('Error al cargar la sesión')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { fetchSession() }, [fetchSession])

  // Polling cada 30s para sincronizar con servidor
  useEffect(() => {
    if (!session || session.status !== 'active') return
    const interval = setInterval(async () => {
      const token = await getToken()
      const res = await fetch(`${API_URL}/sessions/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const updated: SessionDetail = await res.json()
        if (updated.status !== 'active') setSession(updated)
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [session?.status, params.id])

  async function handleEndSession() {
    if (!session) return
    setEnding(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/sessions/${session.id}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Error al finalizar')
      const data = await res.json()
      setSession(prev =>
        prev
          ? {
              ...prev,
              status: 'ended',
              duration_sec: data.duration_sec,
              ended_at: new Date().toISOString(),
              seconds_remaining: null,
            }
          : null
      )
    } catch {
      setError('Error al finalizar la sesión. Intentá de nuevo.')
    } finally {
      setEnding(false)
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-500">
        Cargando sesión...
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="max-w-lg space-y-4">
        <p className="text-sm text-red-500">{error ?? 'Sesión no encontrada'}</p>
        <Button variant="outline" onClick={() => router.push('/sessions')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a sesiones
        </Button>
      </div>
    )
  }

  if (session.status === 'active') {
    return (
      <ActiveSessionView
        session={session}
        onEnd={handleEndSession}
        ending={ending}
      />
    )
  }

  return (
    <EndedSessionView
      session={session}
      onBack={() => router.push('/sessions')}
      formatDate={formatDate}
    />
  )
}

// ── Vista sesión activa ────────────────────────────────────────────────────

function ActiveSessionView({
  session,
  onEnd,
  ending,
}: {
  session: SessionDetail
  onEnd: () => void
  ending: boolean
}) {
  const [expired, setExpired] = useState(false)
  const { formattedTime, secondsLeft } = useSessionTimer({
    initialSeconds: session.seconds_remaining ?? FREE_SESSION_SECONDS,
    onExpire: () => setExpired(true),
  })

  const progress = ((FREE_SESSION_SECONDS - secondsLeft) / FREE_SESSION_SECONDS) * 100

  if (expired) {
    return (
      <EndedSessionView
        session={{ ...session, status: 'expired', duration_sec: FREE_SESSION_SECONDS }}
        onBack={() => window.location.assign('/sessions')}
        formatDate={iso => new Date(iso).toLocaleDateString('es-AR', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })}
      />
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Badge className="gap-1.5 bg-green-100 text-green-700 border-green-200 animate-pulse">
          <Radio className="w-3 h-3" />
          EN VIVO
        </Badge>
        <span className="text-sm text-gray-500">Sesión gratuita</span>
      </div>

      {/* Timer */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-[#1B6CA8] to-[#7B35A2] text-white">
        <CardContent className="py-10 flex flex-col items-center gap-2">
          <p className="text-7xl font-bold tracking-tight tabular-nums">{formattedTime}</p>
          <p className="text-white/70 text-sm">tiempo restante</p>
        </CardContent>
      </Card>

      {/* Info + progreso */}
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Empresa</p>
              <p className="font-semibold text-gray-900">{session.company || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Puesto</p>
              <p className="font-semibold text-gray-900">{session.job_title || '—'}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Tiempo usado</span>
              <span>{formatDuration(FREE_SESSION_SECONDS - secondsLeft)} / 10m</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Finalizar */}
      <Button
        variant="outline"
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={onEnd}
        disabled={ending}
      >
        {ending ? 'Finalizando...' : 'Finalizar sesión'}
      </Button>
    </div>
  )
}

// ── Vista sesión terminada / expirada ──────────────────────────────────────

function EndedSessionView({
  session,
  onBack,
  formatDate,
}: {
  session: SessionDetail & { duration_sec?: number | null }
  onBack: () => void
  formatDate: (iso: string) => string
}) {
  const router = useRouter()
  const isExpired = session.status === 'expired'

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-gray-500 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Sesiones
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isExpired ? 'Sesión expirada' : 'Sesión finalizada'}
        </h1>
        <Badge
          variant="outline"
          className={`mt-2 ${isExpired ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
        >
          {isExpired ? 'Expirada' : 'Completada'}
        </Badge>
      </div>

      {/* Mensaje créditos agotados — solo si expiró */}
      {isExpired && (
        <div className="rounded-lg bg-gray-100 px-4 py-3 flex items-center gap-2 text-sm font-medium text-gray-900">
          Tu sesión gratuita de 10 minutos ha finalizado. Para seguir usando
          <Image src="/logo.png" alt="listnr.io" width={18} height={18} className="rounded inline-block mx-1" />
          en tus próximas entrevistas, adquirí créditos en la sección{' '}
          <a href="/billing" className="underline" style={{ color: '#1B6CA8' }}>Créditos</a>
        </div>
      )}

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Empresa</p>
            <p className="font-semibold text-gray-900">{session.company || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Puesto</p>
            <p className="font-semibold text-gray-900">{session.job_title || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Duración</p>
            <p className="font-semibold text-gray-900">
              {session.duration_sec != null ? formatDuration(session.duration_sec) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Fecha</p>
            <p className="font-semibold text-gray-900">{formatDate(session.started_at)}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Ver historial
        </Button>
        <Button
          onClick={() => router.push('/sessions')}
          className="flex-1 text-white gap-2"
          style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
        >
          Nueva sesión
        </Button>
      </div>
    </div>
  )
}
