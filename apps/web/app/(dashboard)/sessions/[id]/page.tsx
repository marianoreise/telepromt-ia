'use client'

import { useState, useEffect, useCallback, useRef, use, useLayoutEffect } from 'react'
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
import { ArrowLeft, Radio, Mic, MicOff, Monitor, Sparkles, Loader2, X, GripVertical } from 'lucide-react'
import { consumeSharedStream } from '@/lib/session-stream'

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
  const [leftPct, setLeftPct] = useState(55) // % de ancho del panel izquierdo
  const [showAI, setShowAI] = useState(false)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const { formattedTime, secondsLeft } = useSessionTimer({
    initialSeconds: session.seconds_remaining ?? FREE_SESSION_SECONDS,
    onExpire: () => setExpired(true),
  })

  const { state: stt, connect, startListening, stopListening, requestAI, disconnect } = useSTTSession()

  const progress = ((FREE_SESSION_SECONDS - secondsLeft) / FREE_SESSION_SECONDS) * 100
  const isListening = stt.status === 'listening'
  const isConnected = stt.status === 'connected' || isListening

  // Mostrar video del stream compartido
  useLayoutEffect(() => {
    if (videoRef.current && stt.displayStream) {
      videoRef.current.srcObject = stt.displayStream
    }
  }, [stt.displayStream])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [stt.transcriptHistory, stt.currentTranscript])

  // Conectar WebSocket y auto-iniciar con stream compartido si viene del wizard
  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? ''

      // Leer config guardada por el wizard
      const storedConfig = sessionStorage.getItem(`listnr_config_${session.id}`)
      const cfg = storedConfig ? JSON.parse(storedConfig) : null
      const lang = cfg?.language ?? session.language ?? 'es'

      await connect(token, lang, {
        session_id: session.id,
        company: cfg?.company ?? session.company ?? '',
        job_title: cfg?.jobTitle ?? session.job_title ?? '',
        extra_context: cfg?.extraContext ?? '',
        ai_model: cfg?.aiModel ?? '',
        auto_generate: cfg?.autoGenerate ?? true,
      })

      // Si el wizard pasó un stream, usarlo para auto-iniciar
      const sharedStream = consumeSharedStream()
      if (sharedStream) {
        await startListening('system', sharedStream)
        setShowAI(true)
      }
    }
    init()
    return () => disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Resizable divider
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.max(25, Math.min(75, pct)))
    }
    function onUp() { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
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

  return (
    <div className="flex flex-col h-full -m-8" style={{ minHeight: 'calc(100vh - 0px)' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Badge className="gap-1.5 bg-green-100 text-green-700 border-green-200 animate-pulse">
            <Radio className="w-3 h-3" /> EN VIVO
          </Badge>
          {isListening && (
            <Badge className="gap-1.5 bg-red-100 text-red-600 border-red-200 animate-pulse">
              <Mic className="w-3 h-3" /> Escuchando
            </Badge>
          )}
          {stt.status === 'connecting' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Conectando...
            </span>
          )}
          <span className="text-xs text-gray-500 hidden sm:block">
            {session.company} — {session.job_title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tabular-nums text-gray-800">{formattedTime}</span>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
            onClick={() => { disconnect(); onEnd() }}
            disabled={ending}
          >
            {ending ? 'Finalizando...' : 'Finalizar'}
          </Button>
        </div>
      </div>

      {/* ── Banners ── */}
      {stt.error && (
        <div className="px-5 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100 shrink-0">
          {stt.error}
        </div>
      )}
      {stt.status === 'out_of_credits' && (
        <div className="px-5 py-2 text-sm text-amber-700 bg-amber-50 border-b border-amber-100 shrink-0">
          Sin créditos. <a href="/billing" className="font-medium underline">Adquirí más créditos</a>
        </div>
      )}

      {/* ── Main panels ── */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">

        {/* Panel izquierdo — video + transcript */}
        <div
          className="flex flex-col overflow-hidden border-r border-gray-200"
          style={{ width: `${leftPct}%` }}
        >
          {/* Video del screen share */}
          <div className="relative bg-gray-900 shrink-0" style={{ aspectRatio: '16/9', maxHeight: '50%' }}>
            {stt.displayStream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/50 px-8 text-center">
                <Monitor className="w-10 h-10 opacity-40" />
                <p className="text-sm">
                  {isConnected
                    ? 'Hacé click en "Compartir pantalla" para ver la videollamada aquí'
                    : 'Conectando...'}
                </p>
                {isConnected && !isListening && (
                  <Button
                    size="sm"
                    className="mt-2 text-white gap-2"
                    style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
                    onClick={() => { startListening('system'); setShowAI(true) }}
                  >
                    <Monitor className="w-3.5 h-3.5" /> Compartir pantalla
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Controles de audio */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 shrink-0">
            {isListening ? (
              <button
                onClick={stopListening}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <MicOff className="w-3.5 h-3.5" /> Pausar
              </button>
            ) : (
              <button
                onClick={() => startListening('mic')}
                disabled={!isConnected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-40"
              >
                <Mic className="w-3.5 h-3.5" /> Micrófono
              </button>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>{formatDuration(FREE_SESSION_SECONDS - secondsLeft)}</span>
              <span>/</span>
              <span>10m</span>
            </div>
            <div className="w-24">
              <Progress value={progress} className="h-1.5" />
            </div>
          </div>

          {/* Transcripción */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-white">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Transcripción</p>
            {stt.transcriptHistory.length === 0 && !stt.currentTranscript && (
              <p className="text-xs text-gray-400 italic">
                {isListening ? 'Escuchando...' : 'Iniciá la escucha para ver la transcripción'}
              </p>
            )}
            {stt.transcriptHistory.map((entry, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">{entry.text}</p>
            ))}
            {stt.currentTranscript && (
              <p className="text-sm text-gray-400 italic">{stt.currentTranscript}</p>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* ── Divider arrastrable ── */}
        <div
          className="w-1.5 bg-gray-100 hover:bg-blue-200 cursor-col-resize flex items-center justify-center shrink-0 transition-colors"
          onMouseDown={() => { dragging.current = true }}
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>

        {/* Panel derecho — Respuestas IA */}
        <div className="flex flex-col flex-1 overflow-hidden bg-white">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 shrink-0">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-gray-700">Respuestas IA</span>
            {stt.isAIThinking && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400 ml-auto" />
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-16">
            {/* Historial de respuestas */}
            {stt.aiResponseHistory.length === 0 && !stt.isAIThinking && !stt.currentAIResponse && (
              <p className="text-xs text-gray-400 italic">
                Las respuestas IA aparecerán aquí. Podés pedirlas manualmente con el botón de abajo.
              </p>
            )}
            {/* Respuesta en curso */}
            {stt.isAIThinking && (
              <div className="rounded-xl p-4 bg-gradient-to-br from-[#1B6CA8]/5 to-[#7B35A2]/5 border border-purple-100 space-y-2">
                {stt.currentAIQuestion && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#1B6CA8] mb-0.5">Pregunta</p>
                    <p className="text-xs text-gray-500 leading-relaxed italic">{stt.currentAIQuestion}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7B35A2] mb-0.5">Respuesta</p>
                  {stt.currentAIResponse ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900 font-medium">
                      {stt.currentAIResponse}
                      <span className="inline-block w-0.5 h-4 bg-purple-500 ml-0.5 animate-pulse align-middle" />
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-purple-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Generando respuesta...
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Historial previo */}
            {stt.aiResponseHistory.slice().reverse().map((r, i) => (
              <div key={i} className={`rounded-xl p-4 space-y-2 ${i === 0 && !stt.isAIThinking ? 'bg-gradient-to-br from-[#1B6CA8]/5 to-[#7B35A2]/5 border border-purple-100' : 'bg-gray-50 border border-gray-100 opacity-60'}`}>
                {r.question && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#1B6CA8] mb-0.5">Pregunta</p>
                    <p className="text-xs text-gray-500 leading-relaxed italic">{r.question}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7B35A2] mb-0.5">Respuesta</p>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${i === 0 && !stt.isAIThinking ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                    {r.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Botón flotante Respuestas IA ── */}
      {!showAI && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => { setShowAI(true); requestAI() }}
            disabled={!isConnected || stt.isAIThinking}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
          >
            <Sparkles className="w-4 h-4" />
            Respuestas IA
          </button>
        </div>
      )}
      {showAI && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={requestAI}
            disabled={!isConnected || stt.isAIThinking}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
          >
            {stt.isAIThinking
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
              : <><Sparkles className="w-4 h-4" /> Pedir respuesta IA</>
            }
          </button>
        </div>
      )}
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
  const [showTranscript, setShowTranscript] = useState(false)
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
          Mis sesiones
        </Button>
        <Button
          onClick={() => setShowTranscript(v => !v)}
          disabled={!session.transcript}
          className="flex-1 text-white gap-2 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
          title={!session.transcript ? 'No hay transcripción guardada para esta sesión' : undefined}
        >
          {showTranscript ? 'Ocultar transcripción' : 'Transcripción'}
        </Button>
      </div>

      {/* Transcripción expandible */}
      {showTranscript && session.transcript && (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Transcripción</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto pr-1 pb-2">
              {session.transcript.split('\n').filter(Boolean).map((line, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1">{line}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
