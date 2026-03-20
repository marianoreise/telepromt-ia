// MainScreen.tsx — Pantalla principal con tabs Crear | Sesiones pasadas

import { useState } from 'react';
import type { MainTab, Session, SessionType } from '../types';
import { COLORS, FONT, RADIUS, tabBar, tabBtn, tooltipHint } from '../theme';
import { PastSessions } from './PastSessions';

interface MainScreenProps {
  sessions: Session[];
  onSelectType: (type: SessionType) => void;
}

interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

export function MainScreen({ sessions, onSelectType }: MainScreenProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('crear');
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
    x: 0,
    y: 0,
  });

  const showTooltip = (text: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ visible: true, text, x: rect.left, y: rect.top - 94 });
  };

  const hideTooltip = () => setTooltip((prev) => ({ ...prev, visible: false }));

  const FREE_TOOLTIP =
    'Una sesión gratuita no usa créditos, pero dura 10 minutos máximo. No podrás crear otra sesión gratuita por los próximos 15 minutos.';
  const FULL_TOOLTIP =
    'Las sesiones completas gastan 0.5 créditos cada 30 minutos de uso activo.';

  const sessionTypeBtn = (
    active: boolean,
    label: string,
    onClick: () => void,
    tooltipText: string
  ) => (
    <button
      onClick={onClick}
      onMouseEnter={(e) => showTooltip(tooltipText, e)}
      onMouseLeave={hideTooltip}
      style={{
        flex: 1,
        padding: '9px 12px',
        border: active ? 'none' : `1px solid ${COLORS.borderInput}`,
        borderRadius: RADIUS.md,
        background: active ? COLORS.btnPrimary : COLORS.btnSecondaryBg,
        color: active ? COLORS.btnPrimaryText : COLORS.btnSecondaryText,
        fontFamily: FONT.family,
        fontSize: FONT.sizeSm,
        fontWeight: FONT.weightSemibold,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <div style={tabBar}>
        <button
          style={{ ...tabBtn(activeTab === 'crear'), fontFamily: FONT.family }}
          onClick={() => setActiveTab('crear')}
        >
          Crear
        </button>
        <button
          style={{ ...tabBtn(activeTab === 'sesiones'), fontFamily: FONT.family }}
          onClick={() => setActiveTab('sesiones')}
        >
          Sesiones pasadas
        </button>
      </div>

      {/* Contenido */}
      {activeTab === 'crear' ? (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Tipo de sesión */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.family,
                  fontSize: FONT.sizeSm,
                  fontWeight: FONT.weightSemibold,
                  color: COLORS.textPrimary,
                }}
              >
                Tipo de sesión
              </span>
              <span
                style={tooltipHint}
                onMouseEnter={(e) =>
                  showTooltip(
                    'Elegí entre sesión gratuita (10 minutos) o sesión completa con créditos.',
                    e
                  )
                }
                onMouseLeave={hideTooltip}
              >
                i
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {sessionTypeBtn(false, 'Sesión gratuita', () => onSelectType('free'), FREE_TOOLTIP)}
              {sessionTypeBtn(false, 'Sesión de Pago', () => onSelectType('full'), FULL_TOOLTIP)}
            </div>
          </div>
        </div>
      ) : (
        <PastSessions sessions={sessions} />
      )}

      {/* Tooltip flotante */}
      {tooltip.visible && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y,
            left: Math.min(tooltip.x, 280),
            zIndex: 9999,
            background: '#1f2937',
            color: '#f9fafb',
            padding: '6px 10px',
            borderRadius: RADIUS.md,
            fontFamily: FONT.family,
            fontSize: FONT.sizeXs,
            maxWidth: '200px',
            lineHeight: 1.4,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

