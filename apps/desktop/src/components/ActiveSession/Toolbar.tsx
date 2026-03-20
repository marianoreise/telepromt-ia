// Toolbar.tsx — Barra de herramientas de la sesión activa (fondo oscuro, overlay)

import React, { useRef, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize } from '@tauri-apps/api/dpi';
import type { Session } from '../../types';
import { COLORS, FONT, RADIUS, overlayBar } from '../../theme';

interface ToolbarProps {
  session: Session;
  timerDisplay: string;
  isSystemAudioOn: boolean;
  isMicOn: boolean;
  showChat: boolean;
  isRequestingAI: boolean;
  userEmail: string;
  autoGenerate: boolean;
  onToggleSystemAudio: () => void;
  onToggleMic: () => void;
  onRequestAI: () => void;
  onScreenshot: () => void;
  onToggleChat: () => void;
  onToggleAutoGenerate: () => void;
  onStop: () => void;
  onCollapse: () => void;
  onLogout: () => void;
}

// Alturas para la soundwave (ciclo de 4 frames)
const BAR_HEIGHTS: number[][] = [
  [3, 8, 11, 8, 3],
  [5, 11, 8, 11, 5],
  [8, 6, 13, 6, 8],
  [6, 10, 8, 10, 6],
];

export function Toolbar({
  session,
  timerDisplay,
  isSystemAudioOn,
  isMicOn,
  showChat,
  isRequestingAI,
  userEmail,
  autoGenerate,
  onToggleSystemAudio,
  onToggleMic,
  onRequestAI,
  onScreenshot,
  onToggleChat,
  onToggleAutoGenerate,
  onStop,
  onCollapse,
  onLogout,
}: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Soundwave animada cuando hay audio activo
  const audioActive = isSystemAudioOn || isMicOn;
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!audioActive) return;
    const interval = setInterval(() => setFrame((f) => (f + 1) % 4), 200);
    return () => clearInterval(interval);
  }, [audioActive]);
  const barHeights = BAR_HEIGHTS[frame];

  // Redimensionar ventana cuando el menú se abre/cierra (evita que quede cortado)
  useEffect(() => {
    const w = window.innerWidth || 1920;
    if (menuOpen) {
      getCurrentWindow().setSize(new LogicalSize(w, 320)).catch(() => {});
    } else {
      getCurrentWindow().setSize(new LogicalSize(w, 56)).catch(() => {});
    }
  }, [menuOpen]);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleDrag = () => {
    invoke('start_dragging').catch(() => {});
  };

  const handleClose = () => {
    invoke('close_window').catch(() => {
      getCurrentWindow().close().catch(() => {});
    });
  };

  const openDashboard = () => {
    invoke('open_url', { url: 'https://telepromt-ia.vercel.app/dashboard' }).catch(() => {
      window.open('https://telepromt-ia.vercel.app/dashboard', '_blank');
    });
    setMenuOpen(false);
  };

  // Botón small overlay (fondo oscuro)
  const overlayBtn = (
    active?: boolean,
    danger?: boolean,
    highlight?: boolean
  ): React.CSSProperties => ({
    background: highlight
      ? 'rgba(59,130,246,0.35)'
      : danger
      ? 'rgba(239,68,68,0.35)'
      : active
      ? 'rgba(34,197,94,0.25)'
      : 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    color: COLORS.textWhite,
    fontFamily: FONT.family,
    fontSize: '11px',
    fontWeight: FONT.weightMedium,
    cursor: 'pointer',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap' as const,
    lineHeight: 1,
    transition: 'background 0.12s',
    flexShrink: 0,
  });

  const iconOnlyBtn = (active?: boolean, danger?: boolean): React.CSSProperties => ({
    ...overlayBtn(active, danger),
    padding: '4px 6px',
    fontSize: '14px',
    minWidth: '26px',
    justifyContent: 'center',
  });

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: '40px',
    right: '10px',
    zIndex: 9999,
    background: 'rgba(15,15,25,0.97)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: RADIUS.lg,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    minWidth: '210px',
    overflow: 'hidden',
    fontFamily: FONT.family,
    fontSize: FONT.sizeSm,
    color: COLORS.textWhite,
  };

  const menuItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 14px',
    cursor: 'pointer',
    transition: 'background 0.12s',
  };

  const menuDivider: React.CSSProperties = {
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
    margin: '4px 0',
  };

  // Idioma legible
  const langLabel: Record<string, string> = {
    castellano: 'Castellano',
    ingles: 'Inglés',
    'cast-eng': 'Cast/Eng',
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ ...overlayBar, justifyContent: 'space-between', width: '100%' }} data-tauri-drag-region>
        {/* Grupo izquierda: audio controles + soundwave */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Soundwave animada cuando hay audio */}
          {audioActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', height: '16px', marginRight: '2px' }}>
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '2px',
                    height: `${h}px`,
                    borderRadius: '2px',
                    background: COLORS.accentGreen,
                    transition: 'height 0.15s ease',
                  }}
                />
              ))}
            </div>
          )}

          {/* Audio sistema */}
          <button
            onClick={onToggleSystemAudio}
            style={iconOnlyBtn()}
            title={isSystemAudioOn ? 'Audio sistema activo (click para pausar)' : 'Audio sistema pausado (click para activar)'}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              🖥
              {isSystemAudioOn && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '-2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: COLORS.accentRed,
                  }}
                />
              )}
            </span>
          </button>

          {/* Micrófono */}
          <button
            onClick={onToggleMic}
            style={iconOnlyBtn()}
            title={isMicOn ? 'Micrófono activo (click para pausar)' : 'Micrófono pausado (click para activar)'}
          >
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              🎤
              {isMicOn && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '-2px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: COLORS.accentRed,
                  }}
                />
              )}
            </span>
          </button>
        </div>

        {/* Grupo central: acciones IA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={onRequestAI}
            disabled={isRequestingAI}
            style={{ ...overlayBtn(false, false, true), opacity: isRequestingAI ? 0.6 : 1 }}
            title="Solicitar respuesta IA"
          >
            {isRequestingAI ? 'Generando...' : 'Respuesta IA ✨'}
          </button>

          <button
            onClick={onScreenshot}
            style={overlayBtn()}
            title="Capturar y analizar pantalla"
          >
            Analizar Pantalla 🖥
          </button>

          <button
            onClick={onToggleChat}
            style={overlayBtn(showChat)}
            title="Abrir/cerrar chat manual"
          >
            Chat
          </button>
        </div>

        {/* Grupo derecha: timer + controles ventana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Timer + stop */}
          <button
            onClick={onStop}
            style={{
              ...overlayBtn(false, session.type === 'free'),
              gap: '6px',
              padding: '4px 8px',
            }}
            title="Detener sesión"
          >
            <span style={{ fontSize: '10px' }}>■</span>
            <span style={{ fontWeight: FONT.weightSemibold }}>{timerDisplay}</span>
          </button>

          {/* Menú ⋮ */}
          <button
            ref={menuBtnRef}
            onClick={() => setMenuOpen((v) => !v)}
            style={{ ...iconOnlyBtn(), fontSize: '18px' }}
            title="Menú"
          >
            ⋮
          </button>

          {/* Drag ⠿ */}
          <button
            onMouseDown={handleDrag}
            style={iconOnlyBtn()}
            title="Mover ventana"
          >
            ⠿
          </button>

          {/* Colapsar */}
          <button
            onClick={onCollapse}
            style={iconOnlyBtn()}
            title="Colapsar"
          >
            ∧
          </button>

          {/* Cerrar */}
          <button
            onClick={handleClose}
            style={iconOnlyBtn()}
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Menú contextual sesión activa */}
      {menuOpen && (
        <div
          ref={menuRef}
          style={menuStyle}
        >
          {/* Email del usuario */}
          <div
            style={{
              ...menuItemStyle,
              cursor: 'default',
              background: 'rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span style={{ fontSize: '14px' }}>👤</span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </span>
          </div>

          {/* Empresa / idioma de sesión */}
          <div
            style={{
              ...menuItemStyle,
              cursor: 'default',
              background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '2px',
              padding: '7px 14px',
            }}
          >
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Sesión activa</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px' }}>🎬</span>
              <span style={{ fontSize: FONT.sizeSm }}>{session.company}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                🌐 {langLabel[session.language] ?? session.language}
              </span>
            </div>
          </div>

          <div style={menuDivider} />

          {/* Dashboard */}
          <div
            style={menuItemStyle}
            onClick={openDashboard}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
          >
            <span>🔲</span>
            <span>Dashboard</span>
          </div>

          {/* Auto Generate toggle */}
          <div
            style={{ ...menuItemStyle, cursor: 'default', justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚡</span>
              <span>Auto Responder</span>
            </span>
            <div
              onClick={onToggleAutoGenerate}
              style={{
                width: '32px',
                height: '18px',
                borderRadius: '9px',
                background: autoGenerate ? COLORS.accentGreen : 'rgba(255,255,255,0.2)',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: autoGenerate ? '16px' : '2px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </div>

          <div style={menuDivider} />

          <div
            style={menuItemStyle}
            onClick={() => { onStop(); setMenuOpen(false); }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
          >
            <span>⏹</span>
            <span>Finalizar sesión</span>
          </div>

          <div
            style={menuItemStyle}
            onClick={() => { onCollapse(); setMenuOpen(false); }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
          >
            <span>🚪</span>
            <span>Salir sin finalizar</span>
          </div>

          <div style={menuDivider} />

          <div
            style={{ ...menuItemStyle, color: COLORS.accentRed }}
            onClick={() => { onLogout(); setMenuOpen(false); }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
          >
            <span>→</span>
            <span>Cerrar sesión</span>
          </div>
        </div>
      )}
    </div>
  );
}
