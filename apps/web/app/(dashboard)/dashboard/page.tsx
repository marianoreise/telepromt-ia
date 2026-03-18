import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    { label: 'Completar perfil', done: onboardingStep >= 1 },
    { label: 'Subir CV / Resume', done: onboardingStep >= 2 },
    { label: 'Descargar app desktop', done: onboardingStep >= 3 },
  ]

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {displayName}</h1>
        <p className="text-gray-500 mt-1">Tu asistente IA para entrevistas y videollamadas</p>
      </div>

      {/* Saldo de créditos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Créditos disponibles</CardDescription>
            <CardTitle className="text-3xl">{Number(balance).toFixed(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">{minutesLeft} minutos restantes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plan actual</CardDescription>
            <CardTitle className="text-xl">
              <Badge variant="secondary">Gratuito</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a href="/billing" className="inline-flex h-7 items-center rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-muted">
              Comprar créditos
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>App Desktop</CardDescription>
            <CardTitle className="text-sm font-medium">Windows 10/11 · v1.0.0</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={DOWNLOAD_URL}
              className="inline-flex items-center gap-1.5 h-8 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar .exe
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding */}
      {onboardingStep < 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Primeros pasos</CardTitle>
            <CardDescription>Completá estos pasos para empezar a usar Telepromt IA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${step.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {step.label}
                </span>
                {!step.done && i === onboardingStep && (
                  <a href={['/settings', '/knowledge', DOWNLOAD_URL][i]} className="ml-auto inline-flex h-7 items-center rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-muted">
                    {i === 2 ? 'Descargar' : 'Ir'}
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
