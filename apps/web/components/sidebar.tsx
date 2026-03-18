'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

const DOWNLOAD_URL = 'https://github.com/marianoreise/telepromt-ia/releases/latest/download/Telepromt.IA_0.1.0_x64-setup.exe'

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

      <div className="p-3 border-t space-y-1">
        <a
          href={DOWNLOAD_URL}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar para Windows
        </a>
        <p className="text-xs text-gray-500 truncate px-1">{user.email}</p>
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
