// Toolbar.tsx — Barra de herramientas de la sesión activa (fondo oscuro, overlay)

import { useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { Session } from '../../types';
import { COLORS, FONT, RADIUS, overlayBar } from '../../theme';

interface ToolbarProps {
  session: Session;
  timerDisplay: string;
  isSystemAudioOn: boolean;
  isMicOn: boolean;
  showChat: boolean;
  onToggleSystemAudio: () => void;
  onToggleMic: () => void;
  onRequestAI: () => void;
  onScreenshot: () => void;
  onToggleChat: () => void;
  onStop: () => void;
  onCollapse: () => void;
  onLogout: () => void;
}

export function Toolbar({
  session,
  timerDisplay,
  isSystemAudioOn,
  isMicOn,
  showChat,
  onToggleSystemAudio,
  onToggleMic,
  onRequestAI,
  onScreenshot,
  onToggleChat,
  onStop,
  onCollapse,
  onLogout,
}: ToolbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDrag = () => {
    // start_dragging es el comando Rust registrado en lib.rs
    invoke('start_dragging').catch(() => {});
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch {
      // Fallback sin Tauri
    }
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
    minWidth: '190px',
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

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ ...overlayBar, justifyContent: 'space-between', width: '100%' }} data-tauri-drag-region>
        {/* Grupo izquierda: audio controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
            style={overlayBtn(false, false, true)}
            title="Solicitar respuesta IA"
          >
            Respuesta IA ✨
          </button>

          <button
            onClick={onScreenshot}
            style={overlayBtn()}
            title="Capturar y analizar pantalla"
          >
            Analizar 🖥
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
          onMouseLeave={() => setMenuOpen(false)}
        >
          <div
            style={{
              ...menuItemStyle,
              cursor: 'default',
              background: 'rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span style={{ fontSize: '14px' }}>🎬</span>
            <span style={{ fontSize: FONT.sizeSm, color: 'rgba(255,255,255,0.6)' }}>
              Sesión: {session.company}
            </span>
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
            onClick={() => setMenuOpen(false)}
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
