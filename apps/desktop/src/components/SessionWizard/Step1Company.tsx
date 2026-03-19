// Step1Company.tsx — Paso 1 del wizard: Empresa + Descripción del puesto

import type { SessionConfig } from '../../types';
import { COLORS, FONT, RADIUS, label, input, textarea, btnPrimary, btnSecondary, tooltipHint } from '../../theme';

interface Step1Props {
  config: Partial<SessionConfig>;
  onChange: (partial: Partial<SessionConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step1Company({ config, onChange, onNext, onBack }: Step1Props) {
  const company = config.company ?? '';
  const jobDescription = config.jobDescription ?? '';

  const canAdvance = company.trim().length > 0 && jobDescription.trim().length > 0;

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Empresa */}
      <div>
        <div style={{ ...label, fontFamily: FONT.family }}>
          Empresa
          <span style={tooltipHint} title="Nombre de la empresa para la que estás entrevistando.">
            i
          </span>
        </div>
        <input
          type="text"
          value={company}
          onChange={(e) => onChange({ company: e.target.value })}
          placeholder="Ej: Microsoft, Google..."
          style={{
            ...input,
            fontFamily: FONT.family,
            outlineColor: COLORS.borderFocus,
          }}
        />
      </div>

      {/* Descripción del puesto */}
      <div>
        <div style={{ ...label, fontFamily: FONT.family }}>
          Descripción del puesto
          <span style={tooltipHint} title="Rol o descripción del trabajo. Podés pegar el texto del anuncio.">
            i
          </span>
        </div>
        <textarea
          value={jobDescription}
          onChange={(e) => onChange({ jobDescription: e.target.value })}
          placeholder="Ej: Developer, Ingeniero de Software Sr...."
          rows={3}
          style={{
            ...textarea,
            fontFamily: FONT.family,
            outlineColor: COLORS.borderFocus,
          }}
        />
      </div>

      {/* Botones */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          marginTop: '4px',
        }}
      >
        <button
          onClick={onBack}
          style={{ ...btnSecondary, fontFamily: FONT.family, borderRadius: RADIUS.md }}
        >
          Volver
        </button>
        <button
          onClick={onNext}
          disabled={!canAdvance}
          style={{
            ...btnPrimary,
            fontFamily: FONT.family,
            borderRadius: RADIUS.md,
            opacity: canAdvance ? 1 : 0.4,
            cursor: canAdvance ? 'pointer' : 'not-allowed',
          }}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
