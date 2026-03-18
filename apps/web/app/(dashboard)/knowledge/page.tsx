'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

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
      setSources(data.sources ?? [])
    }
    setLoaded(true)
  }

  async function handleUpload(file: File) {
    setUploading(true)
    setError('')
    setSuccess('')
    const token = await getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_URL}/knowledge/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (res.ok) {
      const data = await res.json()
      setSuccess(`"${data.source_name}" subido — ${data.chunks_created} fragmentos indexados`)
      loadSources()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.detail ?? 'Error al subir el archivo')
    }
    setUploading(false)
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
          <CardDescription>Subí tu CV para que el asistente responda con tu experiencia real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center text-gray-400 hover:border-blue-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-sm mb-2">Arrastrá tu CV aquí o</p>
            <Button
              variant="outline"
              disabled={uploading}
              onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
            >
              {uploading ? 'Subiendo...' : 'Seleccionar archivo (PDF, DOCX, TXT)'}
            </Button>
            <p className="text-xs mt-2 text-gray-400">Máximo 5 MB</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}
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
