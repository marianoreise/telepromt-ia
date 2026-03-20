// ActivateScreen.tsx — Confirmación antes de activar la sesión

import type { SessionConfig } from '../types';
import { COLORS, FONT, RADIUS, btnPrimary, btnSecondary } from '../theme';

interface ActivateScreenProps {
  config: Partial<SessionConfig>;
  onActivate: () => void;
  onBack: () => void;
}

export function ActivateScreen({ config, onActivate, onBack }: ActivateScreenProps) {
  const isFree = config.type === 'free';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
        gap: '16px',
      }}
    >
      {/* Título */}
      <h2
        style={{
          margin: 0,
          fontFamily: FONT.family,
          fontSize: FONT.sizeLg,
          fontWeight: FONT.weightBold,
          color: COLORS.textPrimary,
          textAlign: 'center',
        }}
      >
        Activar sesión
      </h2>

      {/* Info de tipo de sesión */}
      {isFree ? (
        <div
          style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: RADIUS.lg,
            padding: '12px 14px',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '16px', flexShrink: 0 }}>ⓘ</span>
          <p
            style={{
              margin: 0,
              fontFamily: FONT.family,
              fontSize: FONT.sizeSm,
              color: '#0369a1',
              lineHeight: 1.5,
            }}
          >
            Esta es una sesión gratuita de 10 minutos.
            <br />
            No podrás crear otra sesión gratuita por los próximos 15 minutos.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: '#f9fafb',
            border: `1px solid ${COLORS.borderInput}`,
            borderRadius: RADIUS.lg,
            padding: '12px 14px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: FONT.family,
              fontSize: FONT.sizeSm,
              color: COLORS.textSecondary,
              lineHeight: 1.5,
            }}
          >
            Esta sesión completa usará{' '}
            <strong style={{ color: COLORS.textPrimary }}>0.5 créditos</strong> cada 30 minutos de
            uso activo.
          </p>
        </div>
      )}

      {/* Resumen de configuración */}
      <div
        style={{
          background: '#f9fafb',
          border: `1px solid ${COLORS.borderHeader}`,
          borderRadius: RADIUS.md,
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {config.company && (
          <div
            style={{
              fontFamily: FONT.family,
              fontSize: FONT.sizeSm,
              color: COLORS.textSecondary,
            }}
          >
            <strong style={{ color: COLORS.textPrimary }}>Empresa:</strong> {config.company}
          </div>
        )}
        {config.language && (
          <div
            style={{
              fontFamily: FONT.family,
              fontSize: FONT.sizeSm,
              color: COLORS.textSecondary,
            }}
          >
            <strong style={{ color: COLORS.textPrimary }}>Idioma:</strong>{' '}
            {config.language === 'castellano'
              ? 'Castellano'
              : config.language === 'ingles'
              ? 'Inglés'
              : 'Cast/Eng'}
          </div>
        )}
      </div>

      {/* Sugerencia de video mock */}
      <div
        style={{
          fontFamily: FONT.family,
          fontSize: FONT.sizeSm,
          color: COLORS.textSecondary,
          lineHeight: 1.5,
          textAlign: 'center',
        }}
      >
        También podés hacer screen share de una entrevista mock en YouTube para probar la app.
      </div>

      {/* Botones */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={onBack}
          style={{ ...btnSecondary, fontFamily: FONT.family, borderRadius: RADIUS.md }}
        >
          Volver
        </button>
        <button
          onClick={onActivate}
          style={{ ...btnPrimary, fontFamily: FONT.family, borderRadius: RADIUS.md }}
        >
          {isFree ? 'Activar (Gratis)' : 'Activar'}
        </button>
      </div>
    </div>
  );
}
