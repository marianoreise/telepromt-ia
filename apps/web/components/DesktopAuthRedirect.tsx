'use client';

// DesktopAuthRedirect — Se renderiza cuando el usuario llega desde la app desktop
// con ?desktop_auth=true. Redirige al deep link listnr://auth?token=... para
// autenticar la app desktop con los tokens de la sesión web activa.

import { useEffect, useState } from 'react';

interface Props {
  accessToken: string;
  refreshToken: string;
}

export function DesktopAuthRedirect({ accessToken, refreshToken }: Props) {
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const deepLink = `listnr://auth?token=${encodeURIComponent(accessToken)}&refresh=${encodeURIComponent(refreshToken)}`;
    // setTimeout para que el UI "Abriendo ListnrIO..." se renderice antes del redirect
    const timer = setTimeout(() => {
      window.location.href = deepLink;
      setSent(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [accessToken, refreshToken]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        padding: '48px',
        textAlign: 'center',
        gap: '12px',
      }}
    >
      <div style={{ fontSize: '32px' }}>🔗</div>
      <p style={{ fontSize: '18px', fontWeight: 600, color: '#1B6CA8', margin: 0 }}>
        Abriendo ListnrIO...
      </p>
      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, maxWidth: '320px' }}>
        {sent
          ? 'Si la app no se abrió, asegurate de tener ListnrIO instalado en tu computadora.'
          : 'Autenticando tu sesión en la app desktop.'}
      </p>
    </div>
  );
}
