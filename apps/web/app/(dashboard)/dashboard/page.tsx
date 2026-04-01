import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, Clock, CheckCircle2, Circle, PlayCircle } from 'lucide-react'
import { DesktopAuthRedirect } from '@/components/DesktopAuthRedirect'

async function getUserData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, creditsRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('user_credits').select('balance').eq('user_id', user.id).single(),
  ])

  return {
    user,
    profile: profileRes.data,
    balance: creditsRes.data?.balance ?? 0,
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ desktop_auth?: string }>
}) {
  // Si viene desde la app desktop, emitir el deep link de autenticación
  const params = await searchParams
  if (params.desktop_auth === 'true') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // getSession is acceptable here only to extract the token for the deep link —
      // the user identity was already verified by getUser() above.
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        return (
          <DesktopAuthRedirect
            accessToken={session.access_token}
            refreshToken={session.refresh_token ?? ''}
          />
        )
      }
    }
  }

  const data = await getUserData()
  if (!data) return null

  const { user, profile, balance } = data
  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Usuario'
  const onboardingStep = profile?.onboarding_step ?? 0
  const minutesLeft = Math.round(Number(balance) * 30)

  const STEPS = [
    { label: 'Completar perfil', href: '/settings', done: onboardingStep >= 1 },
    { label: 'Subir CV / Resume', href: '/knowledge', done: onboardingStep >= 2 },
    { label: 'Iniciar primera sesión', href: '/sessions', done: onboardingStep >= 3 },
  ]

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Bienvenido, <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Tu asistente IA para entrevistas y videollamadas en tiempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-[#1B6CA8] to-[#7B35A2] text-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-white/70 text-xs font-medium uppercase tracking-wide">Créditos disponibles</CardDescription>
            <CardTitle className="text-4xl font-bold text-white">{Number(balance).toFixed(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <Clock className="w-3.5 h-3.5" />
              {minutesLeft} minutos restantes
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wide text-gray-400">Plan actual</CardDescription>
            <CardTitle className="text-xl flex items-center gap-2">
              <Badge className="bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20 hover:bg-[#F5A623]/10">
                <Zap className="w-3 h-3 mr-1" />
                Gratuito
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href="/billing"
              className="inline-flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              Comprar créditos
            </a>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wide text-gray-400">Sesiones</CardDescription>
            <CardTitle className="text-sm font-semibold text-gray-700">Asistente en tiempo real</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href="/sessions"
              className="inline-flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Nueva sesión
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding */}
      {onboardingStep < 3 && (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Primeros pasos</CardTitle>
            <CardDescription className="text-sm">Completá estos pasos para empezar a usar listnr.io</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                {step.done
                  ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  : <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                }
                <span className={`text-sm flex-1 ${step.done ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                  {step.label}
                </span>
                {!step.done && i === onboardingStep && (
                  <a
                    href={step.href}
                    className="inline-flex items-center h-7 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Completar
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
