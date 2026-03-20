'use client'

// DesktopAuthPage — Página de autenticación exitosa para la app desktop.
// Muestra botón "Abrir ListnrIO" que dispara el deep link listnr://auth?token=...
// El botón requiere click explícito del usuario para que el navegador permita
// abrir la app sin bloquear la redirección (comportamiento de browsers modernos).

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  email: string
  accessToken: string
  refreshToken: string
}

export function DesktopAuthPage({ email, accessToken, refreshToken }: Props) {
  const [opened, setOpened] = useState(false)

  const deepLink = `listnr://auth?token=${encodeURIComponent(accessToken)}&refresh=${encodeURIComponent(refreshToken)}`

  const handleOpen = () => {
    window.location.href = deepLink
    setOpened(true)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        padding: '48px 24px',
        gap: '0',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <Image src="/logo.png" alt="listnr.io" width={64} height={64} style={{ borderRadius: '16px' }} />
        <span style={{ fontSize: '36px', fontWeight: 700, color: '#1B6CA8', letterSpacing: '-0.5px' }}>
          listnr<span style={{ color: '#F5A623' }}>.io</span>
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          textAlign: 'center',
        }}
      >
        {/* Ícono de éxito */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
          }}
        >
          ✓
        </div>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
            Autenticación exitosa
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Bienvenido, <strong style={{ color: '#374151' }}>{email}</strong>
          </p>
        </div>

        {!opened ? (
          <>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
              Hacé clic en el botón para abrir la app desktop y quedar autenticado.
            </p>

            <button
              onClick={handleOpen}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #1B6CA8 0%, #7B35A2 100%)',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
            >
              <span>🖥</span>
              Abrir ListnrIO
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
              Se abrió la solicitud en tu navegador.{' '}
              <strong style={{ color: '#374151' }}>Aceptá el diálogo</strong> para continuar en la app.
            </p>

            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
              Si la app no se abrió, asegurate de tener ListnrIO instalado.
            </p>

            <button
              onClick={handleOpen}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                background: 'transparent',
                color: '#374151',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Intentar de nuevo
            </button>
          </>
        )}

        <a
          href="/dashboard"
          style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}
        >
          ← Volver al dashboard
        </a>
      </div>
    </div>
  )
}
