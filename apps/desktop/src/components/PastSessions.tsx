// PastSessions.tsx — Lista de sesiones pasadas

import type { Session } from '../types';
import { COLORS, FONT, RADIUS } from '../theme';

interface PastSessionsProps {
  sessions: Session[];
}

const TYPE_LABEL: Record<Session['type'], string> = {
  free: 'Gratuita',
  full: 'Completa',
};

const STATUS_LABEL: Record<Session['status'], string> = {
  active: 'Activa',
  completed: 'Completada',
  expired: 'Expirada',
};

const STATUS_COLOR: Record<Session['status'], string> = {
  active: COLORS.accentGreen,
  completed: COLORS.textSecondary,
  expired: COLORS.accentRed,
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

export function PastSessions({ sessions }: PastSessionsProps) {
  if (sessions.length === 0) {
    return (
      <div
        style={{
          padding: '32px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '32px' }}>📋</span>
        <p
          style={{
            fontFamily: FONT.family,
            fontSize: FONT.sizeBase,
            color: COLORS.textSecondary,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          No tenés sesiones pasadas.
          <br />
          Creá tu primera sesión.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {sessions.map((session) => (
        <div
          key={session.id}
          style={{
            padding: '10px 16px',
            borderBottom: `1px solid ${COLORS.borderHeader}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontFamily: FONT.family,
                fontSize: FONT.sizeBase,
                fontWeight: FONT.weightSemibold,
                color: COLORS.textPrimary,
              }}
            >
              {session.company}
            </span>
            <span
              style={{
                fontFamily: FONT.family,
                fontSize: FONT.sizeXs,
                color: STATUS_COLOR[session.status],
                fontWeight: FONT.weightSemibold,
              }}
            >
              {STATUS_LABEL[session.status]}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: FONT.family,
              fontSize: FONT.sizeSm,
              color: COLORS.textSecondary,
            }}
          >
            <span
              style={{
                background: '#f3f4f6',
                padding: '1px 6px',
                borderRadius: RADIUS.sm,
              }}
            >
              {TYPE_LABEL[session.type]}
            </span>
            <span>{session.language}</span>
            <span style={{ marginLeft: 'auto' }}>{formatDate(session.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
