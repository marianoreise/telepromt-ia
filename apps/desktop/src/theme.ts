// ── Sistema de diseño visual — ListnrIO Desktop ───────────────────────────────
// Todos los estilos inline para evitar flash de estilos

import type { CSSProperties } from 'react';

export const COLORS = {
  // Fondos
  bgWindow: 'rgba(255,255,255,1)',
  bgHeader: '#ffffff',
  bgPanel: 'rgba(10,10,20,0.90)',
  bgOverlay: 'rgba(10,10,20,0.90)',

  // Bordes
  borderHeader: '#e5e7eb',
  borderInput: '#d1d5db',
  borderFocus: '#111827',

  // Texto
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textWhite: '#ffffff',
  textMuted: '#9ca3af',

  // Botones
  btnPrimary: '#000000',
  btnPrimaryText: '#ffffff',
  btnSecondaryBorder: '#d1d5db',
  btnSecondaryBg: '#ffffff',
  btnSecondaryText: '#111827',

  // Acentos
  accentGreen: '#22c55e',
  accentRed: '#ef4444',
  accentBlue: '#3b82f6',
  accentAmber: '#f59e0b',

  // Tabs
  tabActive: '#111827',
  tabInactive: '#6b7280',

  // Toggle
  toggleOn: '#22c55e',
  toggleOff: '#d1d5db',
  toggleCircle: '#ffffff',
} as const;

export const FONT = {
  family: "'Segoe UI', system-ui, sans-serif",
  sizeXs: '10px',
  sizeSm: '11px',
  sizeBase: '13px',
  sizeMd: '14px',
  sizeLg: '16px',
  sizeXl: '20px',
  size2xl: '24px',
  weightNormal: 400 as const,
  weightMedium: 500 as const,
  weightSemibold: 600 as const,
  weightBold: 700 as const,
} as const;

export const RADIUS = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  full: '9999px',
} as const;

// ── Estilos base reutilizables ────────────────────────────────────────────────

export const baseContainer: CSSProperties = {
  width: '420px',
  minWidth: '420px',
  maxWidth: '420px',
  fontFamily: FONT.family,
  fontSize: FONT.sizeBase,
  color: COLORS.textPrimary,
  background: COLORS.bgWindow,
  userSelect: 'none',
  boxSizing: 'border-box',
  overflow: 'hidden',
};

export const header: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  background: COLORS.bgHeader,
  borderBottom: `1px solid ${COLORS.borderHeader}`,
  gap: '6px',
  flexShrink: 0,
};

export const tabBar: CSSProperties = {
  display: 'flex',
  borderBottom: `1px solid ${COLORS.borderHeader}`,
  background: COLORS.bgHeader,
  flexShrink: 0,
};

export const tabBtn = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '10px 0',
  background: 'transparent',
  border: 'none',
  borderBottom: active ? `2px solid ${COLORS.tabActive}` : '2px solid transparent',
  color: active ? COLORS.tabActive : COLORS.tabInactive,
  fontFamily: FONT.family,
  fontSize: FONT.sizeBase,
  fontWeight: active ? FONT.weightSemibold : FONT.weightNormal,
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export const contentArea: CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  overflowY: 'auto',
  maxHeight: 'calc(100vh - 100px)',
};

export const label: CSSProperties = {
  fontSize: FONT.sizeSm,
  fontWeight: FONT.weightSemibold,
  color: COLORS.textPrimary,
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

export const input: CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  border: `1px solid ${COLORS.borderInput}`,
  borderRadius: RADIUS.md,
  fontFamily: FONT.family,
  fontSize: FONT.sizeBase,
  color: COLORS.textPrimary,
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

export const textarea: CSSProperties = {
  ...input,
  resize: 'vertical',
  minHeight: '64px',
  lineHeight: '1.5',
};

export const select: CSSProperties = {
  ...input,
  cursor: 'pointer',
  appearance: 'auto',
};

export const btnPrimary: CSSProperties = {
  padding: '8px 16px',
  background: COLORS.btnPrimary,
  color: COLORS.btnPrimaryText,
  border: 'none',
  borderRadius: RADIUS.md,
  fontFamily: FONT.family,
  fontSize: FONT.sizeBase,
  fontWeight: FONT.weightSemibold,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
  whiteSpace: 'nowrap' as const,
};

export const btnSecondary: CSSProperties = {
  padding: '8px 16px',
  background: COLORS.btnSecondaryBg,
  color: COLORS.btnSecondaryText,
  border: `1px solid ${COLORS.btnSecondaryBorder}`,
  borderRadius: RADIUS.md,
  fontFamily: FONT.family,
  fontSize: FONT.sizeBase,
  fontWeight: FONT.weightNormal,
  cursor: 'pointer',
  transition: 'background 0.15s',
  whiteSpace: 'nowrap' as const,
};

export const iconBtn: CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '3px 5px',
  borderRadius: RADIUS.sm,
  fontSize: FONT.sizeMd,
  color: COLORS.textPrimary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
  transition: 'background 0.12s',
  flexShrink: 0,
};

export const iconBtnWhite: CSSProperties = {
  ...iconBtn,
  color: COLORS.textWhite,
};

export const tooltipHint: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '14px',
  height: '14px',
  borderRadius: RADIUS.full,
  background: COLORS.borderInput,
  color: COLORS.textSecondary,
  fontSize: '9px',
  fontWeight: FONT.weightBold,
  cursor: 'default',
  flexShrink: 0,
};

export const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
};

export const rowStart: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

// Overlay oscuro (sesión activa)
export const overlayBar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 10px',
  background: COLORS.bgOverlay,
  backdropFilter: 'blur(12px)',
  flexWrap: 'wrap' as const,
};

export const overlayPanel: CSSProperties = {
  background: 'rgba(10,10,20,0.88)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.10)',
  color: COLORS.textWhite,
};
