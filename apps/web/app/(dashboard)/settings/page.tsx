'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const inputCls = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    display_name: '',
    role: '',
    target_company: '',
    preferred_language: 'es',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
      if (data) setForm({ display_name: data.display_name ?? '', role: data.role ?? '', target_company: data.target_company ?? '', preferred_language: data.preferred_language ?? 'es' })
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Sesión expirada. Recargá la página.'); return }

      const { error: upsertError } = await supabase.from('user_profiles').upsert(
        { user_id: user.id, ...form, onboarding_step: 1 },
        { onConflict: 'user_id' }
      )

      if (upsertError) {
        setError(`Error al guardar: ${upsertError.message}`)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <Card>
        <CardHeader>
          <CardTitle>Perfil profesional</CardTitle>
          <CardDescription>Esta información se usa para personalizar las respuestas del asistente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="display_name" className="text-sm font-medium">Nombre</label>
              <input id="display_name" className={inputCls} autoComplete="off" value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Tu nombre completo" />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">Rol / Posición</label>
              <input id="role" className={inputCls} autoComplete="off" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="ej: Senior Software Engineer" />
            </div>
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">Empresa objetivo</label>
              <input id="company" className={inputCls} autoComplete="off" value={form.target_company} onChange={e => setForm(f => ({ ...f, target_company: e.target.value }))} placeholder="ej: Google, Mercado Libre" />
            </div>
            <div className="space-y-2">
              <label htmlFor="lang" className="text-sm font-medium">Idioma de respuestas</label>
              <select id="lang" value={form.preferred_language} onChange={e => setForm(f => ({ ...f, preferred_language: e.target.value }))} className={inputCls}>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading}>
              {saved ? '¡Guardado!' : loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
