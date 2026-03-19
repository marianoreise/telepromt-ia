import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Zap, Clock, CheckCircle2, Circle } from 'lucide-react'

const DOWNLOAD_URL = 'https://github.com/marianoreise/telepromt-ia/releases/latest/download/Telepromt.IA_0.1.0_x64-setup.exe'

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

export default async function DashboardPage() {
  const data = await getUserData()
  if (!data) return null

  const { user, profile, balance } = data
  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Usuario'
  const onboardingStep = profile?.onboarding_step ?? 0
  const minutesLeft = Math.round(Number(balance) * 30)

  const STEPS = [
    { label: 'Completar perfil', href: '/settings', done: onboardingStep >= 1 },
    { label: 'Subir CV / Resume', href: '/knowledge', done: onboardingStep >= 2 },
    { label: 'Descargar app desktop', href: DOWNLOAD_URL, done: onboardingStep >= 3 },
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
            <CardDescription className="text-xs font-medium uppercase tracking-wide text-gray-400">App Desktop</CardDescription>
            <CardTitle className="text-sm font-semibold text-gray-700">Windows 10/11 · v1.0.0</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={DOWNLOAD_URL}
              className="inline-flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .exe
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
                    {i === 2 ? 'Descargar' : 'Completar'}
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
