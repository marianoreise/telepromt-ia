'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard' },
  { href: '/knowledge',  label: 'Conocimiento' },
  { href: '/sessions',   label: 'Sesiones' },
  { href: '/settings',   label: 'Configuración' },
  { href: '/billing',    label: 'Créditos' },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg text-blue-600">Telepromt IA</h1>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname.startsWith(item.href) && item.href !== '/'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t">
        <p className="text-xs text-gray-500 truncate mb-2">{user.email}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
