// Header.tsx — Barra superior: logo + créditos + botones de control

import { useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { User, AppScreen } from '../types';
import { COLORS, FONT, RADIUS, header, iconBtn } from '../theme';
import { AccountMenu } from './AccountMenu';

interface HeaderProps {
  user: User | null;
  onSetScreen: (screen: AppScreen) => void;
  onLogout: () => void;
  previousScreen?: AppScreen;
}

export function Header({ user, onSetScreen, onLogout, previousScreen = 'main' }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const handleDrag = () => {
    // start_dragging es el comando Rust registrado en lib.rs
    invoke('start_dragging').catch(() => {});
  };

  const handleClose = async () => {
    try {
      // En Tauri v2 usamos la API de ventana directamente para cerrar
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {
      // Fallback sin Tauri (entorno de desarrollo en navegador)
    }
  };

  const handleCollapse = () => {
    onSetScreen('collapsed');
  };

  return (
    <>
      <div
        style={{
          ...header,
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: FONT.weightBold,
            fontSize: FONT.sizeMd,
            color: COLORS.textPrimary,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '16px' }}>🦜</span>
          <span>ListnrIO</span>
        </div>

        {/* Controles derecha */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          {/* Créditos */}
          {user && (
            <button
              title="Clic para comprar créditos"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                background: COLORS.btnPrimary,
                color: COLORS.btnPrimaryText,
                border: 'none',
                borderRadius: RADIUS.full,
                fontFamily: FONT.family,
                fontSize: FONT.sizeSm,
                fontWeight: FONT.weightSemibold,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span>⊙</span>
              <span>{user.credits}</span>
            </button>
          )}

          {/* Menú ⋮ */}
          {user && (
            <button
              ref={menuBtnRef}
              onClick={() => setMenuOpen((v) => !v)}
              style={{ ...iconBtn, fontSize: '18px', lineHeight: 1 }}
              title="Menú"
            >
              ⋮
            </button>
          )}

          {/* Mover ventana ⊕ */}
          <button
            onMouseDown={handleDrag}
            style={{ ...iconBtn }}
            title="Mover ventana"
          >
            ⊕
          </button>

          {/* Colapsar ^ */}
          <button
            onClick={handleCollapse}
            style={{ ...iconBtn }}
            title="Colapsar"
          >
            ^
          </button>

          {/* Cerrar ✕ */}
          <button
            onClick={handleClose}
            style={{ ...iconBtn, color: COLORS.textSecondary }}
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Menú desplegable */}
      {menuOpen && user && (
        <AccountMenu
          user={user}
          onLogout={onLogout}
          onClose={() => setMenuOpen(false)}
          anchorRef={menuBtnRef}
        />
      )}

      {/* Suprimir warning de previousScreen no usado */}
      {previousScreen && null}
    </>
  );
}
