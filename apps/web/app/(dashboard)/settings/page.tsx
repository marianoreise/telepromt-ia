'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RoleCombobox } from '@/components/role-combobox'

const lbl = "block text-sm font-medium text-gray-700 mb-1"

export default function SettingsPage() {
  const supabase = useRef(createClient()).current
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [lang, setLang] = useState('es')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('user_profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? '')
          setRole(data.role ?? '')
          setTargetCompany(data.target_company ?? '')
          setLang(data.preferred_language ?? 'es')
        }
      })
    })
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Sesión expirada. Recargá la página.'); return }
      const { error: upsertError } = await supabase.from('user_profiles').upsert(
        { user_id: user.id, display_name: displayName, role, target_company: targetCompany, preferred_language: lang, onboarding_step: 1 },
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
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Configuración</h1>

      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Perfil profesional</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Esta información se usa para personalizar las respuestas del asistente</p>

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="f_name" className={lbl}>Nombre</label>
            <Input id="f_name" type="text" placeholder="Tu nombre completo" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className={lbl}>Perfil profesional</label>
            <RoleCombobox value={role} onChange={setRole} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="f_company" className={lbl}>Empresa objetivo</label>
            <Input id="f_company" type="text" placeholder="ej: Google, Mercado Libre" value={targetCompany} onChange={e => setTargetCompany(e.target.value)} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="f_lang" className={lbl}>Idioma de respuestas</label>
            <select
              id="f_lang"
              value={lang}
              onChange={e => setLang(e.target.value)}
              style={{ display: 'block', width: '100%', height: 40, padding: '0 12px', border: '1px solid #d1d5db', borderRadius: 8, background: 'white', fontSize: 14, outline: 'none' }}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <Button type="submit" disabled={loading}>
            {saved ? '¡Guardado!' : loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </form>
      </div>
    </div>
  )
}
