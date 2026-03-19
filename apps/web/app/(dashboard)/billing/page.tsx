'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface Package {
  id: string
  credits: number
  price: number
  currency: string
  title: string
}

const PACKAGES: (Package & { popular?: boolean; description: string })[] = [
  {
    id: 'starter',
    credits: 10,
    price: 10000,
    currency: 'ARS',
    title: 'Starter',
    description: '10 créditos · 5 horas de sesión',
  },
  {
    id: 'pro',
    credits: 25,
    price: 20000,
    currency: 'ARS',
    title: 'Pro',
    description: '25 créditos · 12.5 horas de sesión',
    popular: true,
  },
  {
    id: 'max',
    credits: 60,
    price: 55000,
    currency: 'ARS',
    title: 'Max',
    description: '60 créditos · 30 horas de sesión',
  },
]

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-production-c314.up.railway.app'

export default function BillingPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // Check payment status from redirect
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (status === 'success') setStatusMsg('✅ Pago aprobado. Tus créditos ya están disponibles.')
    if (status === 'failure') setStatusMsg('❌ El pago fue rechazado. Podés intentarlo de nuevo.')
    if (status === 'pending') setStatusMsg('⏳ Pago pendiente. Te avisaremos cuando se acredite.')

    fetchBalance()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchBalance() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const res = await fetch(`${BACKEND_URL}/sessions/balance`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
      }
    } catch {
      // balance stays null
    }
  }

  async function handleBuy(pkgId: string) {
    setLoadingPkg(pkgId)
    setStatusMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setStatusMsg('❌ Sesión expirada. Por favor recargá la página.')
        return
      }

      const res = await fetch(`${BACKEND_URL}/payments/create-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ package_id: pkgId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setStatusMsg(`❌ Error al crear el pago: ${err.detail || res.statusText}`)
        return
      }

      const data = await res.json()
      // Use sandbox_init_point in dev, init_point in prod
      const checkoutUrl =
        process.env.NODE_ENV === 'production' ? data.init_point : data.sandbox_init_point
      window.location.href = checkoutUrl
    } catch {
      setStatusMsg('❌ Error de conexión. Por favor intentá de nuevo.')
    } finally {
      setLoadingPkg(null)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Créditos</h1>
        {balance !== null && (
          <div className="text-right">
            <p className="text-sm text-gray-500">Saldo actual</p>
            <p className="text-2xl font-bold text-green-600">{balance.toFixed(1)} créditos</p>
          </div>
        )}
      </div>

      <p className="text-gray-500">
        1 crédito = 30 minutos de sesión activa. Los créditos no vencen.
      </p>

      {statusMsg && (
        <div className="rounded-lg border px-4 py-3 text-sm bg-gray-50">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PACKAGES.map(plan => (
          <Card key={plan.id} className={plan.popular ? 'border-blue-500 border-2' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.title}</CardTitle>
                {plan.popular && <Badge>Popular</Badge>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold">$ {plan.price.toLocaleString('es-AR')} ARS</p>
              <Button
                className="w-full"
                onClick={() => handleBuy(plan.id)}
                disabled={loadingPkg !== null}
              >
                {loadingPkg === plan.id ? 'Redirigiendo...' : 'Pagar con Mercado Pago'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Pagos procesados de forma segura por Mercado Pago · Los créditos se acreditan automáticamente
      </p>
    </div>
  )
}
