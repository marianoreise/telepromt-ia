// ChatPanel.tsx — Panel de chat manual para enviar mensajes al WebSocket

import { useState, useRef } from 'react';
import { COLORS, FONT, RADIUS } from '../../theme';

interface ChatPanelProps {
  onSend: (message: string) => void;
  onClose: () => void;
}

export function ChatPanel({ onSend, onClose }: ChatPanelProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const panelStyle: React.CSSProperties = {
    background: 'rgba(10,10,20,0.92)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: RADIUS.xl,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
    color: 'rgba(255,255,255,0.4)',
  };

  const ctrlBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.5)',
    padding: '2px 4px',
    borderRadius: RADIUS.sm,
    fontFamily: FONT.family,
    fontSize: FONT.sizeMd,
    lineHeight: 1,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 10px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    color: COLORS.textWhite,
    fontFamily: FONT.family,
    fontSize: FONT.sizeSm,
    outline: 'none',
  };

  const sendBtn: React.CSSProperties = {
    padding: '6px 12px',
    background: COLORS.btnPrimary,
    color: COLORS.btnPrimaryText,
    border: 'none',
    borderRadius: RADIUS.md,
    fontFamily: FONT.family,
    fontSize: FONT.sizeSm,
    fontWeight: FONT.weightSemibold,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    opacity: text.trim() ? 1 : 0.4,
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={labelStyle}>Chat manual</span>
        <button onClick={onClose} style={ctrlBtn} title="Cerrar chat">
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu pregunta..."
          style={inputStyle}
          autoFocus
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={sendBtn}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
