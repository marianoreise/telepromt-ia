// AccountMenu.tsx — Menú desplegable del botón ⋮

import { useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { User } from '../types';
import { COLORS, FONT, RADIUS } from '../theme';
import { Toggle } from './Toggle';

interface AccountMenuProps {
  user: User;
  onLogout: () => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement>;
}

export function AccountMenu({ user, onLogout, onClose, anchorRef }: AccountMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [privateMode, setPrivateMode] = useState(false);
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('listnr_zoom');
    return saved ? parseFloat(saved) : 1;
  });

  const applyZoom = (value: number) => {
    const clamped = Math.min(1.5, Math.max(0.7, value));
    setZoom(clamped);
    localStorage.setItem('listnr_zoom', String(clamped));
    // Aplicar zoom vía CSS transform (compatible con TypeScript DOM types)
    document.documentElement.style.setProperty('--app-scale', String(clamped));
    document.body.style.transform = `scale(${clamped})`;
    document.body.style.transformOrigin = 'top left';
  };

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  const openDashboard = () => {
    invoke('plugin:shell|open', { path: 'https://listnr.io/dashboard' }).catch(() => {
      window.open('https://listnr.io/dashboard', '_blank');
    });
    onClose();
  };

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: '40px',
    right: '10px',
    zIndex: 9999,
    background: '#ffffff',
    border: `1px solid ${COLORS.borderInput}`,
    borderRadius: RADIUS.lg,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    minWidth: '200px',
    overflow: 'hidden',
    fontFamily: FONT.family,
    fontSize: FONT.sizeBase,
    color: COLORS.textPrimary,
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 14px',
    cursor: 'pointer',
    transition: 'background 0.12s',
  };

  const dividerStyle: React.CSSProperties = {
    height: '1px',
    background: COLORS.borderHeader,
    margin: '4px 0',
  };

  const zoomPct = Math.round(zoom * 100);

  return (
    <div ref={menuRef} style={menuStyle}>
      {/* Usuario */}
      <div
        style={{
          ...itemStyle,
          cursor: 'default',
          background: '#f9fafb',
          borderBottom: `1px solid ${COLORS.borderHeader}`,
        }}
      >
        <span style={{ fontSize: '15px' }}>👤</span>
        <span
          style={{
            fontSize: FONT.sizeSm,
            color: COLORS.textSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {user.email}
        </span>
      </div>

      {/* Dashboard */}
      <div
        style={itemStyle}
        onClick={openDashboard}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#f3f4f6')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
      >
        <span style={{ fontSize: '14px' }}>🔲</span>
        <span>Dashboard</span>
      </div>

      <div style={dividerStyle} />

      {/* Privado */}
      <div style={{ ...itemStyle, cursor: 'default', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>🛡️</span>
          <span>Privado</span>
        </span>
        <Toggle checked={privateMode} onChange={setPrivateMode} />
      </div>

      <div style={dividerStyle} />

      {/* Zoom */}
      <div style={{ ...itemStyle, cursor: 'default', justifyContent: 'space-between' }}>
        <span style={{ fontSize: FONT.sizeSm, color: COLORS.textSecondary }}>
          Zoom {zoomPct}%
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => applyZoom(zoom - 0.1)}
            style={{
              background: '#f3f4f6',
              border: `1px solid ${COLORS.borderInput}`,
              borderRadius: RADIUS.sm,
              cursor: 'pointer',
              padding: '2px 7px',
              fontSize: FONT.sizeSm,
              fontFamily: FONT.family,
            }}
          >
            −
          </button>
          <button
            onClick={() => applyZoom(zoom + 0.1)}
            style={{
              background: '#f3f4f6',
              border: `1px solid ${COLORS.borderInput}`,
              borderRadius: RADIUS.sm,
              cursor: 'pointer',
              padding: '2px 7px',
              fontSize: FONT.sizeSm,
              fontFamily: FONT.family,
            }}
          >
            +
          </button>
          <button
            onClick={() => applyZoom(1)}
            style={{
              background: '#f3f4f6',
              border: `1px solid ${COLORS.borderInput}`,
              borderRadius: RADIUS.sm,
              cursor: 'pointer',
              padding: '2px 7px',
              fontSize: FONT.sizeSm,
              fontFamily: FONT.family,
            }}
          >
            ↺
          </button>
        </div>
      </div>

      <div style={dividerStyle} />

      {/* Cerrar sesión */}
      <div
        style={{ ...itemStyle, color: COLORS.accentRed }}
        onClick={() => { onLogout(); onClose(); }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#fef2f2')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
      >
        <span style={{ fontSize: '14px' }}>→</span>
        <span>Cerrar sesión</span>
      </div>
    </div>
  );
}
