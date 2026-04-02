'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RoleCombobox } from '@/components/role-combobox'
import { createClient } from '@/lib/supabase/client'
import { setSharedStream } from '@/lib/session-stream'
import type { SessionDetail, ActiveSessionConflict } from '@/types/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

type WizardStep =
  | 'setup'
  | 'documents'
  | 'language'
  | 'autogenerate'
  | 'transcript'
  | 'connect'

const STEP_ORDER: WizardStep[] = [
  'setup', 'documents', 'language', 'autogenerate', 'transcript', 'connect',
]

const STEP_TITLES: Record<WizardStep, string> = {
  setup:       'Configurar sesión',
  documents:   'Documentos adicionales',
  language:    'Idioma y configuración IA',
  autogenerate:'Auto generar respuesta IA',
  transcript:  'Guardar transcripción',
  connect:     'Conectar',
}

interface WizardConfig {
  company: string
  jobTitle: string
  cvSource: string | null
  additionalDoc: File | null
  language: 'es' | 'en' | 'es-en'
  extraContext: string
  aiModel: string
  autoGenerate: boolean
  saveTranscript: boolean
}

const DEFAULT_CONFIG: WizardConfig = {
  company: '',
  jobTitle: '',
  cvSource: null,
  additionalDoc: null,
  language: 'es',
  extraContext: '',
  aiModel: 'claude-sonnet-4-5',
  autoGenerate: true,
  saveTranscript: true,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionCreated: (session: SessionDetail) => void
}

export default function NuevaSessionModal({ open, onOpenChange, onSessionCreated }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>('setup')
  const [config, setConfig] = useState<WizardConfig>(DEFAULT_CONFIG)
  const [sources, setSources] = useState<{ source_name: string; created_at: string }[]>([])
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictId, setConflictId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const stepIndex = STEP_ORDER.indexOf(step)

  async function getToken(): Promise<string> {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ''
  }

  useEffect(() => {
    if (!open) return
    setStep('setup')
    setConfig(DEFAULT_CONFIG)
    setError(null)
    setConflictId(null)
    setSourcesLoading(true)
    getToken().then(token =>
      fetch(`${API_URL}/knowledge/sources`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => (r.ok ? r.json() : []))
        .then((list: { source_name: string; created_at: string }[]) => {
          setSources(list)
          const sorted = [...list].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          if (sorted.length > 0) setConfig(c => ({ ...c, cvSource: sorted[0].source_name }))
        })
        .catch(() => setSources([]))
        .finally(() => setSourcesLoading(false))
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function update(patch: Partial<WizardConfig>) {
    setConfig(c => ({ ...c, ...patch }))
  }

  function next() {
    const i = stepIndex + 1
    if (i < STEP_ORDER.length) setStep(STEP_ORDER[i])
  }

  function back() {
    const i = stepIndex - 1
    if (i >= 0) setStep(STEP_ORDER[i])
  }

  async function handleDocUpload(file: File) {
    setDocUploading(true)
    setError(null)
    try {
      const token = await getToken()
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_URL}/knowledge/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (res.ok) {
        update({ additionalDoc: file })
      } else {
        setError('Error al subir el documento. Intentá de nuevo.')
      }
    } catch {
      setError('Error de conexión al subir el documento.')
    } finally {
      setDocUploading(false)
    }
  }

  async function handleActivate() {
    setSubmitting(true)
    setError(null)
    setConflictId(null)

    // 1. Solicitar tab sharing (requiere gesto del usuario)
    let displayStream: MediaStream
    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true,
      } as DisplayMediaStreamOptions)
    } catch {
      setError('No se pudo acceder a la pantalla. Seleccioná una pestaña para continuar.')
      setSubmitting(false)
      return
    }

    // 2. Crear sesión en backend
    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/sessions/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: config.company.trim(),
          job_title: config.jobTitle.trim(),
        }),
      })

      if (res.status === 201) {
        const session: SessionDetail = await res.json()
        // 3. Guardar config de sesión en sessionStorage
        sessionStorage.setItem(
          `listnr_config_${session.id}`,
          JSON.stringify({
            language: config.language,
            extraContext: config.extraContext,
            aiModel: config.aiModel,
            autoGenerate: config.autoGenerate,
            saveTranscript: config.saveTranscript,
            cvSource: config.cvSource,
          })
        )
        // 4. Pasar el stream al singleton para que la sesión lo consuma
        setSharedStream(displayStream)
        onSessionCreated(session)
        onOpenChange(false)
        router.push(`/sessions/${session.id}`)
      } else if (res.status === 409) {
        displayStream.getTracks().forEach(t => t.stop())
        const data: { detail: ActiveSessionConflict } = await res.json()
        setConflictId(data.detail.active_session_id)
      } else {
        displayStream.getTracks().forEach(t => t.stop())
        const data = await res.json().catch(() => ({}))
        setError(data.detail ?? 'Error al crear la sesión')
      }
    } catch {
      displayStream.getTracks().forEach(t => t.stop())
      setError('Error de conexión. Intentá nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const canNext =
    step === 'setup'
      ? config.company.trim().length > 0 && config.jobTitle.trim().length > 0
      : true

  function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={onChange}
        className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    )
  }

  function renderStep() {
    switch (step) {
      case 'setup':
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Input
                placeholder="Google, Meta, Mercado Libre..."
                value={config.company}
                onChange={e => update({ company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Puesto</Label>
              <RoleCombobox
                value={config.jobTitle}
                onChange={v => update({ jobTitle: v })}
                placeholder="Seleccioná el puesto..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>CV de referencia</Label>
              {sourcesLoading ? (
                <p className="text-xs text-gray-400">Cargando CVs...</p>
              ) : sources.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  No tenés ningún CV cargado.{' '}
                  <a href="/knowledge" className="font-semibold underline">Subir CV</a>
                </div>
              ) : (
                <select
                  value={config.cvSource ?? ''}
                  onChange={e => update({ cvSource: e.target.value || null })}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sources.map(s => (
                    <option key={s.source_name} value={s.source_name}>
                      {s.source_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )

      case 'documents':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 leading-relaxed">
              Subí un documento de texto adicional para dar más contexto a listnr durante tu sesión.
              La IA va a leer este documento para generar parte de las respuestas y ser más precisa.
            </p>
            <div className="space-y-1.5">
              <Label>Documento adicional <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {config.additionalDoc ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">📄 {config.additionalDoc.name}</p>
                    <p className="text-xs text-green-600">Documento subido correctamente</p>
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:underline mt-1"
                      onClick={e => { e.stopPropagation(); update({ additionalDoc: null }) }}
                    >
                      Eliminar
                    </button>
                  </div>
                ) : docUploading ? (
                  <p className="text-sm text-gray-400">Subiendo documento...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-3xl">📎</p>
                    <p className="text-sm text-gray-500">Hacé click para seleccionar un archivo</p>
                    <p className="text-xs text-gray-400">.PDF · .DOC · .DOCX</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleDocUpload(file)
                }}
              />
            </div>
          </div>
        )

      case 'language':
        return (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Idioma de la entrevista</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'es', label: 'Castellano' },
                    { value: 'en', label: 'Inglés' },
                    { value: 'es-en', label: 'Cast / Inglés' },
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ language: opt.value })}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      config.language === opt.value
                        ? 'text-white border-transparent'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                    style={
                      config.language === opt.value
                        ? { background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }
                        : {}
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Instrucciones para la IA</Label>
              <textarea
                rows={3}
                placeholder="Ej: Entrevista técnica de backend en Python. Usar terminología de AWS. Respuestas concisas."
                value={config.extraContext}
                onChange={e => update({ extraContext: e.target.value })}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Modelo IA</Label>
              <div className="space-y-2">
                {(
                  [
                    { value: 'claude-sonnet-4-5', label: 'Claude Sonnet', desc: 'Recomendado — respuestas más precisas' },
                    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku', desc: 'Rápido — menor latencia' },
                  ] as const
                ).map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => update({ aiModel: m.value })}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                      config.aiModel === m.value
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        config.aiModel === m.value ? 'border-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {config.aiModel === m.value && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'autogenerate':
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-gray-900">Auto generar respuesta IA</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Si activás esta opción, la IA detecta automáticamente cuando el entrevistador hace
                  una pregunta y genera la respuesta. Si no, deberás presionar el botón{' '}
                  <strong>Ayuda IA</strong> manualmente.
                </p>
              </div>
              <Toggle value={config.autoGenerate} onChange={() => update({ autoGenerate: !config.autoGenerate })} />
            </div>
          </div>
        )

      case 'transcript':
        return (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-gray-900">Guardar transcripción</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  La transcripción completa de la sesión se guardará y podrás verla en tu dashboard
                  después de que la sesión termine.
                </p>
                <p className="text-xs text-gray-400 italic mt-1">
                  Aviso legal: Asegurate de cumplir con las leyes de grabación de tu jurisdicción.
                  Transcribir sin consentimiento puede ser ilegal.
                </p>
              </div>
              <Toggle value={config.saveTranscript} onChange={() => update({ saveTranscript: !config.saveTranscript })} />
            </div>
          </div>
        )

      case 'connect':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Sesión para <strong className="text-gray-900">{config.company}</strong> —{' '}
              <strong className="text-gray-900">{config.jobTitle}</strong>.
            </p>

            <div
              className="rounded-xl p-5 space-y-3"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                Cómo conectar
              </p>
              <p className="text-sm font-bold text-white">
                Seleccioná la pestaña de tu videollamada
              </p>
              <p className="text-xs text-white/75 leading-relaxed">
                Al hacer click en <strong className="text-white">Activar y conectar</strong>, el
                navegador te va a pedir que elijas qué pestaña compartir. Seleccioná la pestaña con
                tu videollamada y activá{' '}
                <strong className="text-white">"Compartir también el audio de la pestaña"</strong>.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  {
                    label: 'Google Meet',
                    icon: (
                      <svg viewBox="0 0 87.5 87.5" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 28.75H12.5A12.5 12.5 0 0 0 0 41.25v5l12.5 7.5 12.5-7.5V53.75h25V41.25A12.5 12.5 0 0 0 50 28.75z" fill="#00832d"/>
                        <path d="M0 41.25v21.25A12.5 12.5 0 0 0 12.5 75H50a12.5 12.5 0 0 0 12.5-12.5V53.75l-25 .001V46.25L25 53.75l-12.5-7.5v-5z" fill="#0066da"/>
                        <path d="M50 28.75H37.5v17.5l12.5 7.5 12.5-7.5V41.25A12.5 12.5 0 0 0 50 28.75z" fill="#e94235"/>
                        <path d="M62.5 53.75v8.75A12.5 12.5 0 0 1 50 75H12.5l12.5 12.5H50A25 25 0 0 0 75 62.5V41.25z" fill="#00ac47"/>
                        <path d="M75 16.25L62.5 28.75v25l12.5 12.5V41.25l12.5-12.5z" fill="#ffba00"/>
                        <path d="M87.5 28.75H75L62.5 16.25H50A25 25 0 0 0 25 41.25v5l12.5-7.5v-5A12.5 12.5 0 0 1 50 21.25h12.5L75 28.75z" fill="#00832d"/>
                        <path d="M75 28.75h12.5v33.75H75z" fill="#ffba00"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Zoom',
                    icon: (
                      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12z" fill="#2D8CFF"/>
                        <path d="M5.5 8.5a1.5 1.5 0 0 1 1.5-1.5h7a1.5 1.5 0 0 1 1.5 1.5v4.25l3-2v4.5l-3-2V15.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5v-7z" fill="#fff"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Teams',
                    icon: (
                      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.625 5.625h-6.75A.375.375 0 0 0 13.5 6v3.375h3a2.25 2.25 0 0 1 2.25 2.25v3.75a2.25 2.25 0 0 1-2.25 2.25H13.5V18a.375.375 0 0 0 .375.375h6.75A.375.375 0 0 0 21 18V6a.375.375 0 0 0-.375-.375z" fill="#5059C9"/>
                        <circle cx="18.375" cy="3.75" r="1.875" fill="#5059C9"/>
                        <circle cx="9.75" cy="4.125" r="2.625" fill="#7B83EB"/>
                        <path d="M15.375 11.625a2.25 2.25 0 0 0-2.25-2.25H5.25a2.25 2.25 0 0 0-2.25 2.25v5.25a5.25 5.25 0 0 0 10.5 0v-5.25z" fill="#7B83EB"/>
                        <path d="M9.75 6.75H5.25A2.25 2.25 0 0 0 3 9v6.75a5.25 5.25 0 0 0 6.75 5.055V6.75z" fill="#4B53BC" opacity=".1"/>
                        <path d="M9.75 6.75v14.498A5.25 5.25 0 0 0 15 16.125v-4.5a2.25 2.25 0 0 0-2.25-2.25H9.75z" fill="#4B53BC" opacity=".2"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'WebEx',
                    icon: (
                      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z" fill="#00BCEB"/>
                        <path d="M18.5 7.5l-3 4.5 3 4.5h-3l-1.5-2.25L12.5 16.5h-3l3-4.5-3-4.5h3l1.5 2.25L15.5 7.5z" fill="#fff"/>
                        <path d="M8 7.5v9H5.5v-9z" fill="#fff"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Slack',
                    icon: (
                      <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z" fill="#E01E5A"/>
                        <path d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
                        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z" fill="#36C5F0"/>
                        <path d="M8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
                        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834z" fill="#2EB67D"/>
                        <path d="M17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
                        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52z" fill="#ECB22E"/>
                        <path d="M15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
                      </svg>
                    ),
                  },
                ].map(p => (
                  <div
                    key={p.label}
                    className="flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-lg px-3 py-1.5"
                  >
                    {p.icon}
                    <span className="text-xs font-medium text-white">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {conflictId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Ya tenés una sesión activa.{' '}
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => router.push(`/sessions/${conflictId}`)}
                >
                  Ir a sesión activa
                </button>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">{STEP_TITLES[step]}</DialogTitle>
          <div className="flex items-center gap-1 pt-1.5">
            {STEP_ORDER.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400">Paso {stepIndex + 1} de {STEP_ORDER.length}</p>
        </DialogHeader>

        <div className="py-2 max-h-[55vh] overflow-y-auto pr-1">
          {renderStep()}
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={step === 'setup' ? () => onOpenChange(false) : back}
            disabled={submitting}
          >
            {step === 'setup' ? 'Cancelar' : '← Atrás'}
          </Button>

          {step === 'connect' ? (
            <Button
              type="button"
              className="flex-1 text-white gap-2"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
              onClick={handleActivate}
              disabled={submitting}
            >
              {submitting ? 'Iniciando...' : '🎙️ Activar y conectar'}
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1 text-white"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
              onClick={next}
              disabled={!canNext}
            >
              Siguiente →
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
