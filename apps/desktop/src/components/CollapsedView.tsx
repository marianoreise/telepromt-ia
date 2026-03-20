// CollapsedView.tsx — Vista colapsada: solo soundwave o logo

import { useState, useEffect } from 'react';
import { COLORS } from '../theme';

interface CollapsedViewProps {
  isSessionActive: boolean;
  onExpand: () => void;
}

export function CollapsedView({ isSessionActive, onExpand }: CollapsedViewProps) {
  const [frame, setFrame] = useState(0);

  // Animación de soundwave cuando hay sesión activa
  useEffect(() => {
    if (!isSessionActive) return;
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 200);
    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Alturas para cada barra de la soundwave (ciclo de 4 frames)
  const BAR_HEIGHTS: number[][] = [
    [4, 10, 14, 10, 4],
    [6, 14, 10, 14, 6],
    [10, 8, 16, 8, 10],
    [8, 12, 10, 12, 8],
  ];

  const heights = BAR_HEIGHTS[frame];

  return (
    <div
      onClick={onExpand}
      title="Expandir ListnrIO"
      style={{
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: isSessionActive
          ? 'rgba(10,10,20,0.90)'
          : 'rgba(255,255,255,0.95)',
        border: isSessionActive
          ? '1px solid rgba(255,255,255,0.15)'
          : `1px solid ${COLORS.borderInput}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.15s',
        userSelect: 'none',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.transform = 'scale(1.08)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.transform = 'scale(1)')}
    >
      {isSessionActive ? (
        // Soundwave animada
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            height: '20px',
          }}
        >
          {heights.map((h, i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: `${h}px`,
                borderRadius: '2px',
                background: COLORS.accentGreen,
                transition: 'height 0.15s ease',
              }}
            />
          ))}
        </div>
      ) : (
        // Logo ListnrIO
        <img
          src="/logo.png"
          alt="ListnrIO"
          style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }}
        />
      )}
    </div>
  );
}
