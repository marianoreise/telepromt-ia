// TranscriptPanel.tsx — Strip de transcripción scrolleable en sesión activa

import { useEffect, useRef } from 'react';
import type { Transcript } from '../../types';
import { FONT, RADIUS } from '../../theme';

interface TranscriptPanelProps {
  transcript: Transcript;
  onClear: () => void;
  onCollapse: () => void;
  onClose: () => void;
}

export function TranscriptPanel({ transcript, onClear, onCollapse, onClose }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llega texto nuevo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript.text]);

  const panelStyle: React.CSSProperties = {
    background: 'rgba(10,10,20,0.88)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: FONT.family,
    fontSize: FONT.sizeXs,
    fontWeight: FONT.weightSemibold,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.65)',
  };

  const scrollAreaStyle: React.CSSProperties = {
    maxHeight: '80px',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.2) transparent',
  };

  const textStyle: React.CSSProperties = {
    fontFamily: FONT.family,
    fontSize: FONT.sizeBase,
    color: transcript.isFinal ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)',
    lineHeight: 1.5,
    margin: 0,
    wordBreak: 'break-word',
  };

  const ctrlBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.5)',
    fontFamily: FONT.family,
    fontSize: FONT.sizeMd,
    padding: '2px 4px',
    borderRadius: RADIUS.sm,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={labelStyle}>
          Transcripción{!transcript.isFinal && transcript.text && ' •••'}
        </span>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            onClick={onClear}
            style={ctrlBtn}
            title="Limpiar transcripción"
          >
            🗑
          </button>
          <button
            onClick={onCollapse}
            style={ctrlBtn}
            title="Colapsar panel"
          >
            ∨
          </button>
          <button
            onClick={onClose}
            style={ctrlBtn}
            title="Cerrar panel"
          >
            ✕
          </button>
        </div>
      </div>

      <div ref={scrollRef} style={scrollAreaStyle}>
        <p style={textStyle}>
          {transcript.text || (
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>Esperando audio...</span>
          )}
        </p>
      </div>
    </div>
  );
}
