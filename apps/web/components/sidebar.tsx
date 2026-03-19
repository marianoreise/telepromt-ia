'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Settings,
  CreditCard,
  Download,
  LogOut,
} from 'lucide-react'

const DOWNLOAD_URL = 'https://github.com/marianoreise/telepromt-ia/releases/latest/download/Telepromt.IA_0.1.0_x64-setup.exe'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/sessions',   label: 'Sesiones',        icon: Video },
  { href: '/knowledge',  label: 'Conocimiento',    icon: BookOpen },
  { href: '/settings',   label: 'Configuración',   icon: Settings },
  { href: '/billing',    label: 'Créditos',        icon: CreditCard },
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
    <aside
      className="w-60 flex flex-col"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10 flex justify-center" style={{ background: 'white' }}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="listnr.io"
            width={55}
            height={55}
            className="rounded-xl"
          />
          <span className="font-bold text-2xl tracking-tight" style={{ color: '#1B6CA8' }}>
            listnr<span style={{ color: '#F5A623' }}>.io</span>
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href) && href !== '/'
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'text-white'
                  : 'hover:text-white'
              )}
              style={{
                background: active ? 'var(--sidebar-active)' : 'transparent',
                color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
        <a
          href={DOWNLOAD_URL}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-white"
          style={{ background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)' }}
        >
          <Download className="w-4 h-4 shrink-0" />
          Descargar para Windows
        </a>

        <div className="px-3 py-2">
          <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>
            {user.email}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all duration-150"
          style={{ color: 'var(--sidebar-text)' }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'
            ;(e.currentTarget as HTMLElement).style.color = 'white'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--sidebar-text)'
          }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
