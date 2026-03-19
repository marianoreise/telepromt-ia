'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Logo + Brand */}
      <div className="flex items-center gap-4 mb-8">
        <Image src="/logo.png" alt="listnr.io" width={78} height={78} className="rounded-2xl" />
        <span className="text-5xl font-bold tracking-tight" style={{ color: '#1B6CA8' }}>
          listnr<span style={{ color: '#F5A623' }}>.io</span>
        </span>
      </div>

      <Card className="w-full max-w-md border border-gray-100 shadow-sm">
        <CardHeader className="text-center pb-2">
          <CardDescription className="text-sm text-gray-500">Iniciá sesión en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              className="w-full text-white"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="font-medium hover:underline" style={{ color: '#1B6CA8' }}>
              Registrate gratis
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
