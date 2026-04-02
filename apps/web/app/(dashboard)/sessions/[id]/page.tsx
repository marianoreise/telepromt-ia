'use client'

import { useState, useEffect, useCallback, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useSessionTimer } from '@/hooks/useSessionTimer'
import { useSTTSession, type AudioSource } from '@/hooks/useSTTSession'
import { formatDuration } from '@/lib/format-duration'
import type { SessionDetail } from '@/types/session'
import Image from 'next/image'
import { ArrowLeft, Radio, Mic, MicOff, Monitor, Sparkles, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const FREE_SESSION_SECONDS = 600

async function getToken(): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SessionDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [ending, setEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/sessions/${id}`, {
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
  }, [id])

  useEffect(() => { fetchSession() }, [fetchSession])

  // Polling cada 30s para sincronizar con servidor
  useEffect(() => {
    if (!session || session.status !== 'active') return
    const interval = setInterval(async () => {
      const token = await getToken()
      const res = await fetch(`${API_URL}/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const updated: SessionDetail = await res.json()
        if (updated.status !== 'active') setSession(updated)
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [session?.status, id])

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
  const [audioSource, setAudioSource] = useState<AudioSource>('mic')
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  const { formattedTime, secondsLeft } = useSessionTimer({
    initialSeconds: session.seconds_remaining ?? FREE_SESSION_SECONDS,
    onExpire: () => setExpired(true),
  })

  const { state: stt, connect, startListening, stopListening, requestAI, disconnect } = useSTTSession()

  const progress = ((FREE_SESSION_SECONDS - secondsLeft) / FREE_SESSION_SECONDS) * 100

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [stt.transcriptHistory, stt.currentTranscript])

  // Connect to backend when component mounts
  useEffect(() => {
    async function initConnection() {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''
      const lang = session.language ?? 'es'
      await connect(token, lang)
    }
    initConnection()
    return () => disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const isListening = stt.status === 'listening'
  const isConnected = stt.status === 'connected' || isListening
  const hasAIResponse = stt.currentAIResponse.length > 0

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className="gap-1.5 bg-green-100 text-green-700 border-green-200 animate-pulse">
            <Radio className="w-3 h-3" />
            EN VIVO
          </Badge>
          {isListening && (
            <Badge className="gap-1.5 bg-red-100 text-red-600 border-red-200 animate-pulse">
              <Mic className="w-3 h-3" />
              Escuchando
            </Badge>
          )}
          {stt.status === 'connecting' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Conectando...
            </span>
          )}
        </div>
        <span className="text-3xl font-bold tabular-nums text-gray-800">{formattedTime}</span>
      </div>

      {/* Error banner */}
      {stt.error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-600">
          {stt.error}
        </div>
      )}

      {/* Out of credits */}
      {stt.status === 'out_of_credits' && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Sin créditos disponibles. <a href="/billing" className="font-medium underline">Adquirí más créditos</a>
        </div>
      )}

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Left — controles + transcript */}
        <div className="space-y-4">
          {/* Audio controls */}
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="py-4 space-y-3">
              {/* Source selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setAudioSource('mic')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    audioSource === 'mic'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Mic className="w-3 h-3" /> Micrófono
                </button>
                <button
                  onClick={() => setAudioSource('system')}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                    audioSource === 'system'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Monitor className="w-3 h-3" /> Audio del sistema
                </button>
              </div>

              {/* Start / Stop listening */}
              {!isListening ? (
                <Button
                  className="w-full text-white gap-2"
                  style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
                  onClick={() => startListening(audioSource)}
                  disabled={!isConnected || stt.status === 'out_of_credits'}
                >
                  <Mic className="w-4 h-4" />
                  Iniciar escucha
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-gray-200 text-gray-700 gap-2"
                  onClick={stopListening}
                >
                  <MicOff className="w-4 h-4" />
                  Pausar escucha
                </Button>
              )}

              {/* Manual AI button */}
              <Button
                variant="outline"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 gap-2"
                onClick={requestAI}
                disabled={!isConnected || stt.isAIThinking}
              >
                {stt.isAIThinking
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando respuesta...</>
                  : <><Sparkles className="w-4 h-4" /> Pedir respuesta IA</>
                }
              </Button>
            </CardContent>
          </Card>

          {/* Session info + progress */}
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Empresa</p>
                  <p className="font-semibold text-gray-900 truncate">{session.company || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">Puesto</p>
                  <p className="font-semibold text-gray-900 truncate">{session.job_title || '—'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Tiempo usado</span>
                  <span>{formatDuration(FREE_SESSION_SECONDS - secondsLeft)} / 10m</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          {/* Transcript */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-gray-600">Transcripción</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="h-40 overflow-y-auto space-y-1 text-sm">
                {stt.transcriptHistory.length === 0 && !stt.currentTranscript && (
                  <p className="text-gray-400 text-xs italic">
                    {isListening ? 'Escuchando... hablá ahora' : 'Iniciá la escucha para ver la transcripción'}
                  </p>
                )}
                {stt.transcriptHistory.map((entry, i) => (
                  <p key={i} className="text-gray-700 leading-snug">{entry.text}</p>
                ))}
                {stt.currentTranscript && (
                  <p className="text-gray-400 italic">{stt.currentTranscript}</p>
                )}
                <div ref={transcriptEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — AI response teleprompter */}
        <div className="flex flex-col">
          <Card className={`flex-1 border shadow-sm transition-all duration-300 ${
            hasAIResponse
              ? 'border-purple-200 bg-gradient-to-br from-[#1B6CA8]/5 to-[#7B35A2]/5'
              : 'border-gray-100'
          }`}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                Respuesta IA
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="min-h-64 flex flex-col justify-start">
                {!hasAIResponse && !stt.isAIThinking && (
                  <p className="text-gray-400 text-xs italic mt-2">
                    La respuesta aparecerá aquí automáticamente cuando se detecte una pregunta,
                    o podés pedirla manualmente.
                  </p>
                )}
                {stt.isAIThinking && !stt.currentAIResponse && (
                  <div className="flex items-center gap-2 text-purple-500 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Generando respuesta...</span>
                  </div>
                )}
                {stt.currentAIResponse && (
                  <p className="text-gray-900 text-base leading-relaxed font-medium whitespace-pre-wrap">
                    {stt.currentAIResponse}
                    {stt.isAIThinking && (
                      <span className="inline-block w-1 h-4 bg-purple-500 ml-0.5 animate-pulse align-middle" />
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Previous AI responses */}
          {stt.aiResponseHistory.length > 1 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Respuestas anteriores</p>
              {stt.aiResponseHistory.slice(0, -1).reverse().slice(0, 2).map((r, i) => (
                <Card key={i} className="border border-gray-100 opacity-60">
                  <CardContent className="py-3 px-4">
                    <p className="text-xs text-gray-600 line-clamp-3">{r.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Finalizar */}
      <Button
        variant="outline"
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => { disconnect(); onEnd() }}
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
          <Image src="/logo.png" alt="listnr.io" width={60} height={20} style={{ height: 'auto' }} className="inline-block mx-1" />
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
