'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/format-duration'
import NuevaSessionModal from '@/components/sessions/NuevaSessionModal'
import type { SessionSummary, SessionDetail } from '@/types/session'
import { Plus, ArrowRight, Clock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function getToken(): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active:  { label: 'En vivo',    className: 'bg-green-100 text-green-700 border-green-200 animate-pulse' },
  ended:   { label: 'Completada', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  expired: { label: 'Expirada',   className: 'bg-amber-100 text-amber-700 border-amber-200' },
}

export default function SessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadSessions = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/sessions/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data: SessionSummary[] = await res.json()
        setSessions(data)
      } else {
        setError('Error al cargar sesiones')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadSessions() }, [loadSessions])

  const activeSession = sessions.find(s => s.status === 'active')

  function handleSessionCreated(session: SessionDetail) {
    setModalOpen(false)
    router.push(`/sessions/${session.id}`)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sesiones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Últimas 5 sesiones</p>
        </div>
        {activeSession ? (
          <Button
            onClick={() => router.push(`/sessions/${activeSession.id}`)}
            className="gap-2 text-white"
            style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Continuar sesión activa
          </Button>
        ) : (
          <Button
            onClick={() => setModalOpen(true)}
            className="gap-2 text-white"
            style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
          >
            <Plus className="w-4 h-4" />
            Nueva sesión
          </Button>
        )}
      </div>

      {/* Lista */}
      {loading && (
        <div className="text-sm text-gray-500 py-8 text-center">Cargando sesiones...</div>
      )}
      {error && (
        <div className="text-sm text-red-500 py-4 text-center">{error}</div>
      )}
      {!loading && !error && sessions.length === 0 && (
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <Clock className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-500 font-medium">No tenés sesiones todavía</p>
            <p className="text-xs text-gray-400">Creá tu primera sesión gratuita de 10 minutos</p>
            <Button
              onClick={() => setModalOpen(true)}
              size="sm"
              className="mt-2 text-white gap-2"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva sesión
            </Button>
          </CardContent>
        </Card>
      )}
      {!loading && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map(session => {
            const badge = STATUS_BADGE[session.status] ?? STATUS_BADGE.ended
            return (
              <Card
                key={session.id}
                className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/sessions/${session.id}`)}
              >
                <CardContent className="py-4 px-5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {session.job_title || 'Sin título'}
                      </span>
                      <Badge variant="outline" className={`text-xs shrink-0 ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{session.company || '—'}</span>
                      <span>·</span>
                      <span>{formatDate(session.started_at)}</span>
                      {session.duration_sec != null && (
                        <>
                          <span>·</span>
                          <span>{formatDuration(session.duration_sec)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <NuevaSessionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  )
}
