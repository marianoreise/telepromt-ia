// /auth/desktop — Página de autenticación para la app desktop ListnrIO
// Ruta pública (no está en PROTEGIDAS del middleware).
// Si el usuario está logueado: muestra tokens y botón para abrir la app.
// Si NO está logueado: redirige a login con ?next=/auth/desktop para volver aquí.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesktopAuthPage } from '@/components/DesktopAuthPage'

export const dynamic = 'force-dynamic'

export default async function DesktopAuthRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/auth/desktop')
  }

  // getUser() ya validó con el servidor — ahora obtenemos los tokens de la sesión
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    // Sesión expirada: forzar re-login
    redirect('/login?next=/auth/desktop')
  }

  return (
    <DesktopAuthPage
      email={user.email ?? ''}
      accessToken={session.access_token}
      refreshToken={session.refresh_token ?? ''}
    />
  )
}
