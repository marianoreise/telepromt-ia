'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { FileText, FileType2, AlertTriangle, ChevronDown, AlertCircle } from 'lucide-react'

const ALLOWED_EXTENSIONS = ['.docx', '.doc', '.txt', '.md']
const ALLOWED_MIME = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  '', // Some browsers send empty MIME type for .md files
]

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

type Source = { source_name: string; chunk_count: number }

export default function KnowledgePage() {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [sources, setSources] = useState<Source[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function getToken() {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ''
  }

  async function loadSources() {
    const token = await getToken()
    const res = await fetch(`${API_URL}/knowledge/sources`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setSources(Array.isArray(data) ? data : (data.sources ?? []))
    }
    setLoaded(true)
  }

  function validateFormat(file: File): string | null {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '')
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME.includes(file.type)) {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        return '¿Tenés tu CV en PDF? Guardalo como DOCX desde Word o Google Docs en menos de 1 minuto.'
      }
      return 'Este formato no es compatible. Subí tu documento en formato DOCX o TXT.'
    }
    return null
  }

  async function handleUpload(file: File) {
    const formatError = validateFormat(file)
    if (formatError) {
      setError(formatError)
      return
    }
    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const token = await getToken()
      const form = new FormData()
      form.append('file', file)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)
      const res = await fetch(`${API_URL}/knowledge/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok) {
        const data = await res.json()
        const chunks = data.chunks_indexed ?? data.chunks_created ?? 0
        setSuccess(`"${data.source_name}" subido — ${chunks} fragmentos indexados`)
        loadSources()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.detail ?? 'Error al subir el archivo')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('La operación tardó demasiado. Intentá con un archivo más pequeño.')
      } else {
        setError('Error de conexión. Intente nuevamente.')
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(sourceName: string) {
    const token = await getToken()
    await fetch(`${API_URL}/knowledge/sources/${encodeURIComponent(sourceName)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setSources(s => s.filter(x => x.source_name !== sourceName))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  if (!loaded) loadSources()

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Base de conocimiento</h1>

      <Card>
        <CardHeader>
          <CardTitle>CV / Resume</CardTitle>
          <CardDescription>
            Subí tu CV para que el asistente responda con tu experiencia real.{' '}
            Mejor resultado: usá DOCX o TXT sin imágenes de diseño.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400 hover:border-blue-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-sm mb-2">Arrastrá tu CV aquí o</p>
            <p className="text-xs text-gray-400 mb-3">Formatos aceptados: DOCX, TXT, MD</p>
            <Button
              variant="outline"
              disabled={uploading}
              onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
            >
              {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
            </Button>
            <p className="text-xs mt-2 text-gray-400">Máx. 5 MB</p>
          </div>

          <details className="group">
            <summary className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none list-none hover:text-foreground transition-colors w-fit">
              <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
              ¿Qué formato usar?
            </summary>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-start gap-2.5 rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2">
                <FileType2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-emerald-700">DOCX sin imágenes — mejor extracción</p>
                  <p className="text-xs text-emerald-600/80">Texto plano, sin tablas complejas ni objetos incrustados.</p>
                </div>
                <span className="ml-auto shrink-0 text-[10px] font-semibold tracking-wide uppercase text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5">
                  Ideal
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-md bg-muted border border-border px-3 py-2">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">TXT / MD — confiable y liviano</p>
                  <p className="text-xs text-muted-foreground">Sin formateo visual, pero extracción perfecta. (Ideal para Markdown).</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 rounded-md bg-red-50 border border-red-100 px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-red-700">PDF — no compatible</p>
                  <p className="text-xs text-red-600/80">Los PDFs no son aceptados. Exportá tu CV como DOCX desde Word o Google Docs.</p>
                </div>
              </div>
            </div>
          </details>

          <input
            ref={inputRef}
            type="file"
            accept=".docx,.doc,.txt,.md"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          />

          {error && (
            <p className="flex items-start gap-1.5 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </p>
          )}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </CardContent>
      </Card>

      {sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos indexados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sources.map(s => (
              <div key={s.source_name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{s.source_name}</p>
                  <p className="text-xs text-gray-400">{s.chunk_count} fragmentos</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(s.source_name)}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
