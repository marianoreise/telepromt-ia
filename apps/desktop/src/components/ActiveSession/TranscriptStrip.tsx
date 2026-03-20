// TranscriptStrip.tsx — Banda de transcripción siempre visible (1 línea)
// Muestra la última frase detectada, truncada con ellipsis si supera el ancho.

import type { Transcript } from '../../types';
import { FONT, COLORS } from '../../theme';

interface TranscriptStripProps {
  transcript: Transcript;
}

export function TranscriptStrip({ transcript }: TranscriptStripProps) {
  const hasText = Boolean(transcript.text);

  const stripStyle: React.CSSProperties = {
    background: 'rgba(10,10,20,0.75)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '5px 14px',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '28px',
  };

  const textStyle: React.CSSProperties = {
    fontFamily: FONT.family,
    fontSize: FONT.sizeSm,
    color: hasText
      ? transcript.isFinal
        ? 'rgba(255,255,255,0.85)'
        : 'rgba(255,255,255,0.65)'
      : COLORS.textMuted,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    lineHeight: 1.4,
  };

  return (
    <div style={stripStyle}>
      <span style={textStyle} title={hasText ? transcript.text : undefined}>
        {hasText ? transcript.text : 'Esperando audio...'}
      </span>
      {/* Indicador de interim (no final) */}
      {!transcript.isFinal && hasText && (
        <span
          style={{
            fontFamily: FONT.family,
            fontSize: FONT.sizeXs,
            color: 'rgba(255,255,255,0.30)',
            marginLeft: '6px',
            flexShrink: 0,
          }}
        >
          •••
        </span>
      )}
    </div>
  );
}
