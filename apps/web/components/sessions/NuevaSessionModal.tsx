'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import type { SessionDetail, ActiveSessionConflict } from '@/types/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

interface NuevaSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSessionCreated: (session: SessionDetail) => void
}

export default function NuevaSessionModal({
  open,
  onOpenChange,
  onSessionCreated,
}: NuevaSessionModalProps) {
  const router = useRouter()
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ company?: string; job_title?: string }>({})
  const [conflictId, setConflictId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function getToken(): Promise<string> {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ''
  }

  function validate(): boolean {
    const errs: { company?: string; job_title?: string } = {}
    if (!company.trim()) errs.company = 'Requerido'
    if (!jobTitle.trim()) errs.job_title = 'Requerido'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setError(null)
    setConflictId(null)

    try {
      const token = await getToken()
      const res = await fetch(`${API_URL}/sessions/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company: company.trim(), job_title: jobTitle.trim() }),
      })

      if (res.status === 201) {
        const data: SessionDetail = await res.json()
        onSessionCreated(data)
        setCompany('')
        setJobTitle('')
      } else if (res.status === 409) {
        const data: { detail: ActiveSessionConflict } = await res.json()
        setConflictId(data.detail.active_session_id)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.detail ?? 'Error al crear la sesión')
      }
    } catch {
      setError('Error de conexión. Intentá nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Nueva sesión</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              placeholder="Google, Meta, Mercado Libre..."
              value={company}
              onChange={e => { setCompany(e.target.value); setFieldErrors(p => ({ ...p, company: undefined })) }}
            />
            {fieldErrors.company && (
              <p className="text-xs text-red-500">{fieldErrors.company}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job_title">Puesto</Label>
            <Input
              id="job_title"
              placeholder="Senior Frontend Engineer, Product Manager..."
              value={jobTitle}
              onChange={e => { setJobTitle(e.target.value); setFieldErrors(p => ({ ...p, job_title: undefined })) }}
            />
            {fieldErrors.job_title && (
              <p className="text-xs text-red-500">{fieldErrors.job_title}</p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Sesión gratuita: 10 minutos
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

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

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              {submitting ? 'Iniciando...' : 'Iniciar sesión'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
