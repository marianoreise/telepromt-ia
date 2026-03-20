// LoginScreen.tsx — Pantalla de login sin sesión activa
// Flujo: botón abre listnr.io en el navegador → deep link listnr://auth?access_token=...
// llega a Rust → Rust emite evento 'auth-callback' → aquí lo escuchamos → onLogin()

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { User } from '../types';
import { COLORS, FONT, RADIUS, btnPrimary, baseContainer, header, iconBtn } from '../theme';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

// URL de la web app con parámetro que indica que hay un desktop esperando auth
const AUTH_URL = 'https://telepromt-ia.vercel.app/dashboard?desktop_auth=true';

// Backend API para obtener datos reales del usuario tras autenticación
const API_URL = import.meta.env.VITE_API_URL ?? 'https://backend-production-c314.up.railway.app';

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
          async (event) => {
            const { access_token } = event.payload;
            try {
              const res = await fetch(`${API_URL}/sessions/me`, {
                headers: { Authorization: `Bearer ${access_token}` },
              });
              if (res.ok) {
                const data = await res.json() as { id: string; email: string; credits: number };
                onLogin({ id: data.id, email: data.email, credits: Math.floor(data.credits), accessToken: access_token });
              } else {
                // Token válido pero el backend falló — login con datos mínimos
                onLogin({ id: access_token.slice(0, 16), email: '', credits: 0, accessToken: access_token });
              }
            } catch {
              // Sin conexión al backend — login con datos mínimos
              onLogin({ id: access_token.slice(0, 16), email: '', credits: 0, accessToken: access_token });
            }
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

  const handleClose = () => {
    invoke('close_window').catch(() => getCurrentWindow().close().catch(() => {}));
  };

  const handleDrag = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().startDragging();
    } catch {
      invoke('start_dragging').catch(() => {});
    }
  };

  return (
    <div
      style={{
        ...baseContainer,
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Mini header solo con controles de ventana */}
      <div
        style={{ ...header, justifyContent: 'flex-end' }}
        data-tauri-drag-region
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onMouseDown={(e) => { e.stopPropagation(); handleDrag(); }}
            style={{ ...iconBtn }}
            title="Mover ventana"
          >
            ⠿
          </button>
          <button
            onClick={handleClose}
            onMouseDown={(e) => e.stopPropagation()}
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
          <img
            src="/logo.png"
            alt="ListnrIO"
            style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: '4px', background: 'white', borderRadius: '12px', padding: '8px' }}
          />
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
                background: 'rgba(59,130,246,0.08)',
                border: `1px solid rgba(59,130,246,0.25)`,
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: FONT.family,
                  fontSize: FONT.sizeBase,
                  color: COLORS.accentBlue,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Esperando autenticación en el navegador...
              </p>
            </div>
            <p
              style={{
                fontFamily: FONT.family,
                fontSize: FONT.sizeSm,
                color: COLORS.textSecondary,
                textAlign: 'center',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Completá el login en el navegador y volvé aquí.
            </p>
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
            Iniciar sesión
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
            Se abrirá el navegador para verificar tu cuenta.
          </p>
        )}
      </div>
    </div>
  );
}
