// LoginScreen.tsx — Pantalla de login sin sesión activa
// Flujo: botón abre listnr.io en el navegador → deep link listnr://auth?access_token=...
// llega a Rust → Rust emite evento 'auth-callback' → aquí lo escuchamos → onLogin()

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { User } from '../types';
import { COLORS, FONT, RADIUS, btnPrimary, baseContainer, header, iconBtn } from '../theme';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

// URL de la web app con parámetro que indica que hay un desktop esperando auth
const AUTH_URL = 'https://listnr.io/dashboard?desktop_auth=true';

// Usuario mock para fallback en desarrollo (cuando Tauri no está disponible)
const MOCK_USER: User = {
  id: 'mock',
  email: 'usuario@listnr.io',
  credits: 27,
};

export function LoginScreen({ onLogin }: LoginScreenProps) {
  // true = el usuario hizo clic y estamos esperando el deep link del navegador
  const [waiting, setWaiting] = useState(false);

  // Escuchar evento auth-callback de Tauri cuando llega el deep link
  // Rust emite: { access_token: string, refresh_token: string }
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    const setup = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<{ access_token: string; refresh_token: string }>(
          'auth-callback',
          (event) => {
            const { access_token, refresh_token: _refresh } = event.payload;
            // Con los tokens podemos inicializar supabase.auth.setSession() en el futuro.
            // Por ahora creamos un user básico — el email y créditos reales se cargarán
            // tras hidratación de Supabase (iteración siguiente).
            onLogin({
              id: access_token.slice(0, 16),
              email: 'usuario@listnr.io',
              credits: 0,
            });
          }
        );
      } catch {
        // Sin entorno Tauri (dev browser): continuar sin escuchar
      }
    };

    setup();

    return () => {
      if (unlisten) unlisten();
    };
  }, [onLogin]);

  const handleLogin = () => {
    // Abrir la web app en el navegador del sistema para que el usuario se autentique.
    // Usa el comando open_url registrado en lib.rs (std::process::Command "cmd /C start").
    invoke('open_url', { url: AUTH_URL })
      .then(() => {
        setWaiting(true);
      })
      .catch(() => {
        // Fallback en entorno de desarrollo sin Tauri: login mock inmediato
        onLogin(MOCK_USER);
      });
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {
      // Fallback sin Tauri
    }
  };

  const handleDrag = () => {
    invoke('start_dragging').catch(() => {});
  };

  return (
    <div
      style={{
        ...baseContainer,
        minHeight: '320px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Mini header solo con controles de ventana */}
      <div
        style={{
          ...header,
          justifyContent: 'flex-end',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          <button
            onMouseDown={handleDrag}
            style={{ ...iconBtn }}
            title="Mover ventana"
          >
            ⊕
          </button>
          <button
            onClick={handleClose}
            style={{ ...iconBtn, color: COLORS.textSecondary }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Contenido centrado */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          gap: '16px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: FONT.family,
              fontSize: FONT.size2xl,
              fontWeight: FONT.weightBold,
              color: COLORS.textPrimary,
              letterSpacing: '-0.02em',
            }}
          >
            ListnrIO
          </span>
        </div>

        {/* Texto descriptivo */}
        <p
          style={{
            fontFamily: FONT.family,
            fontSize: FONT.sizeBase,
            color: COLORS.textSecondary,
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Iniciá sesión para comenzar tu entrevista.
        </p>

        {waiting ? (
          /* Estado de espera: se abrió el navegador, aguardando deep link */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
            }}
          >
            <div
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: RADIUS.lg,
                background: '#f9fafb',
                border: `1px solid ${COLORS.borderInput}`,
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: FONT.family,
                  fontSize: FONT.sizeBase,
                  color: COLORS.textSecondary,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Esperando autenticacion en el navegador...
              </p>
            </div>
            <button
              onClick={() => setWaiting(false)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: FONT.family,
                fontSize: FONT.sizeXs,
                color: COLORS.textMuted,
                padding: '2px 0',
              }}
            >
              Volver
            </button>
          </div>
        ) : (
          /* Estado inicial: mostrar botón de login */
          <button
            onClick={handleLogin}
            style={{
              ...btnPrimary,
              width: '100%',
              padding: '12px 24px',
              fontSize: FONT.sizeMd,
              borderRadius: RADIUS.lg,
            }}
          >
            Iniciar sesion
          </button>
        )}

        {/* Nota al pie */}
        {!waiting && (
          <p
            style={{
              fontFamily: FONT.family,
              fontSize: FONT.sizeXs,
              color: COLORS.textMuted,
              textAlign: 'center',
              margin: 0,
            }}
          >
            Se abrira el navegador para verificar tu cuenta.
          </p>
        )}
      </div>
    </div>
  );
}
