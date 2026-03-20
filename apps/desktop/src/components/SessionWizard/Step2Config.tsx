// Step2Config.tsx — Paso 2 del wizard: Idioma, CV, IA, toggles

import type { SessionConfig, SessionLanguage } from '../../types';
import {
  COLORS,
  FONT,
  RADIUS,
  label,
  select,
  textarea,
  btnPrimary,
  btnSecondary,
  row,
  tooltipHint,
} from '../../theme';
import { Toggle } from '../Toggle';

interface Step2Props {
  config: Partial<SessionConfig>;
  onChange: (partial: Partial<SessionConfig>) => void;
  onNext: () => void;
  onBack: () => void;
}

const LANGUAGE_OPTIONS: { value: SessionLanguage; label: string }[] = [
  { value: 'castellano', label: 'Castellano' },
  { value: 'ingles', label: 'Inglés' },
  { value: 'cast-eng', label: 'Cast/Eng' },
];

export function Step2Config({ config, onChange, onNext, onBack }: Step2Props) {
  const language = config.language ?? 'castellano';
  const simpleLanguage = config.simpleLanguage ?? false;
  const extraContext = config.extraContext ?? '';
  const aiModel = config.aiModel ?? 'claude-sonnet';
  const autoGenerate = config.autoGenerate ?? false;
  const saveTranscript = config.saveTranscript ?? true;

  return (
    <div
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 120px)',
      }}
    >
      {/* Idioma + Lenguaje simple */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Idioma */}
        <div style={{ flex: 1 }}>
          <div style={{ ...label, fontFamily: FONT.family }}>
            Idioma
            <span style={tooltipHint} title="Idioma principal de la entrevista.">
              i
            </span>
          </div>
          <select
            value={language}
            onChange={(e) => onChange({ language: e.target.value as SessionLanguage })}
            style={{ ...select, fontFamily: FONT.family, outlineColor: COLORS.borderFocus }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lenguaje simple */}
        <div>
          <div style={{ ...label, fontFamily: FONT.family, whiteSpace: 'nowrap' }}>
            Lenguaje simple
            <span style={tooltipHint} title="Respuestas más simples y directas.">
              i
            </span>
          </div>
          <div style={{ marginTop: '6px' }}>
            <Toggle checked={simpleLanguage} onChange={(v) => onChange({ simpleLanguage: v })} />
          </div>
        </div>
      </div>

      {/* Contexto extra */}
      <div>
        <div style={{ ...label, fontFamily: FONT.family }}>
          Contexto / Instrucciones extra
          <span
            style={tooltipHint}
            title="Instrucciones adicionales para la IA. Ej: Ser más técnico, enfocarse en liderazgo."
          >
            i
          </span>
        </div>
        <textarea
          value={extraContext}
          onChange={(e) => onChange({ extraContext: e.target.value })}
          placeholder="Ej: Ser más técnico, mencionar experiencia en cloud..."
          rows={2}
          style={{
            ...textarea,
            fontFamily: FONT.family,
            outlineColor: COLORS.borderFocus,
          }}
        />
      </div>

      {/* CV */}
      <div>
        <div style={{ ...label, fontFamily: FONT.family }}>
          📋 CV
          <span style={tooltipHint} title="Seleccioná tu CV para que la IA personalice las respuestas.">
            i
          </span>
        </div>
        <select
          value={config.resumeId ?? ''}
          onChange={(e) => onChange({ resumeId: e.target.value || null })}
          style={{ ...select, fontFamily: FONT.family, outlineColor: COLORS.borderFocus }}
        >
          <option value="">Sin CV</option>
        </select>
        <div style={{ fontSize: '11px', color: COLORS.textSecondary, marginTop: '4px' }}>
          Subí tu CV en{' '}
          <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>listnr.io → Perfil</span>
          {' '}para poder seleccionarlo acá.
        </div>
      </div>

      {/* Modelo IA */}
      <div>
        <div style={{ ...label, fontFamily: FONT.family }}>
          🤖 Modelo IA
          <span style={tooltipHint} title="Modelo de inteligencia artificial para generar respuestas.">
            i
          </span>
        </div>
        <select
          value={aiModel}
          onChange={(e) => onChange({ aiModel: e.target.value })}
          style={{ ...select, fontFamily: FONT.family, outlineColor: COLORS.borderFocus }}
        >
          <option value="claude-sonnet">Claude Sonnet — Recomendado</option>
        </select>
      </div>

      {/* Generar automático */}
      <div style={{ ...row }}>
        <div style={{ ...label, fontFamily: FONT.family, margin: 0 }}>
          Generar respuestas automáticas
          <span
            style={tooltipHint}
            title="La IA genera respuestas automáticamente al detectar una pregunta."
          >
            i
          </span>
        </div>
        <Toggle checked={autoGenerate} onChange={(v) => onChange({ autoGenerate: v })} />
      </div>

      {/* Guardar transcripción */}
      <div style={{ ...row }}>
        <div style={{ ...label, fontFamily: FONT.family, margin: 0 }}>
          Guardar transcripción
          <span style={tooltipHint} title="Guarda el texto transcripto de la sesión al finalizar.">
            i
          </span>
        </div>
        <Toggle checked={saveTranscript} onChange={(v) => onChange({ saveTranscript: v })} />
      </div>

      {/* Botones */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          marginTop: '4px',
          paddingBottom: '8px',
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
          style={{ ...btnPrimary, fontFamily: FONT.family, borderRadius: RADIUS.md }}
        >
          {(config.type === 'free' ? 'Crear sesión gratuita' : 'Crear sesión de pago') + ' →'}
        </button>
      </div>
    </div>
  );
}
