// AnswerPanel.tsx — Panel de respuestas IA con navegación entre respuestas

import { useState } from 'react';
import type { AIMessage } from '../../types';
import { COLORS, FONT, RADIUS } from '../../theme';

interface AnswerPanelProps {
  messages: AIMessage[];
  currentIndex: number;
  isStreaming: boolean;
  streamingText: string;
  onNavigate: (index: number) => void;
  onClear: () => void;
  onClose: () => void;
}

export function AnswerPanel({
  messages,
  currentIndex,
  isStreaming,
  streamingText,
  onNavigate,
  onClear,
  onClose,
}: AnswerPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const panelHeight = expanded ? 480 : 240;

  const total = messages.length + (isStreaming ? 1 : 0);
  const hasContent = total > 0;

  const current =
    isStreaming && currentIndex === messages.length
      ? null // mostrando streaming
      : messages[currentIndex] ?? null;

  const showStreaming = isStreaming && currentIndex >= messages.length;

  const panelStyle: React.CSSProperties = {
    background: 'rgba(10,10,20,0.92)',
    backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: RADIUS.xl,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    height: `${panelHeight}px`,
    overflow: 'hidden',
    position: 'relative',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const navBtn: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: RADIUS.sm,
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.7)',
    padding: '2px 7px',
    fontFamily: FONT.family,
    fontSize: FONT.sizeMd,
    lineHeight: 1,
    transition: 'background 0.12s',
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

  const bodyStyle: React.CSSProperties = {
    overflowY: 'auto',
    flex: 1,
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.2) transparent',
  };

  const textStyle: React.CSSProperties = {
    fontFamily: FONT.family,
    fontSize: FONT.sizeMd,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 1.6,
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  const dotStyle: React.CSSProperties = {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: COLORS.accentBlue,
    marginRight: '6px',
    verticalAlign: 'middle',
    flexShrink: 0,
  };

  const starStyle: React.CSSProperties = {
    display: 'inline-block',
    marginRight: '6px',
    color: COLORS.accentAmber,
    flexShrink: 0,
  };

  // Indicador visual de streaming
  const streamingDots = isStreaming ? (
    <span style={{ color: 'rgba(255,255,255,0.60)' }}>{' '}•••</span>
  ) : null;

  if (!hasContent) {
    return (
      <div style={panelStyle}>
        <div style={headerStyle}>
          <span
            style={{
              fontFamily: FONT.family,
              fontSize: FONT.sizeXs,
              fontWeight: FONT.weightSemibold,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.60)',
            }}
          >
            Respuesta IA
          </span>
          <button onClick={onClose} style={ctrlBtn} title="Cerrar">
            ✕
          </button>
        </div>
        <p style={{ ...textStyle, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '8px 0' }}>
          Presioná "Respuesta IA ✨" para generar una respuesta.
        </p>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {/* Header con nav */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onNavigate(Math.max(0, currentIndex - 1))}
            disabled={currentIndex <= 0}
            style={{ ...navBtn, opacity: currentIndex <= 0 ? 0.3 : 1 }}
          >
            ‹
          </button>
          <span
            style={{
              fontFamily: FONT.family,
              fontSize: FONT.sizeXs,
              color: 'rgba(255,255,255,0.60)',
            }}
          >
            {currentIndex + 1} / {total}
          </span>
          <button
            onClick={() => onNavigate(Math.min(total - 1, currentIndex + 1))}
            disabled={currentIndex >= total - 1}
            style={{ ...navBtn, opacity: currentIndex >= total - 1 ? 0.3 : 1 }}
          >
            ›
          </button>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={onClear} style={ctrlBtn} title="Limpiar respuestas">
            🗑
          </button>
          <button onClick={onClose} style={ctrlBtn} title="Cerrar panel">
            ✕
          </button>
        </div>
      </div>

      {/* Cuerpo scrolleable */}
      <div style={bodyStyle}>
        {showStreaming ? (
          <div>
            <p style={{ ...textStyle, marginBottom: '8px' }}>
              <span style={starStyle}>★</span>
              <strong>Respuesta:</strong>
              {streamingDots}
            </p>
            <p style={textStyle}>{streamingText}</p>
          </div>
        ) : current ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={textStyle}>
              <span style={dotStyle} />
              <strong>Pregunta:</strong> {current.question}
            </p>
            <p style={textStyle}>
              <span style={starStyle}>★</span>
              <strong>Respuesta:</strong>
            </p>
            <p style={textStyle}>{current.answer}</p>
          </div>
        ) : null}
      </div>

      {/* Toggle expand/colapsar — esquina inferior derecha */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)',
          fontSize: '13px',
          padding: '2px',
          lineHeight: 1,
          userSelect: 'none',
        }}
        title={expanded ? 'Reducir panel' : 'Expandir panel'}
      >
        {expanded ? '⤡' : '⤢'}
      </button>
    </div>
  );
}
