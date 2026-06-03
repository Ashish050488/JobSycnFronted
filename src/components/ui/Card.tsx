// FILE: src/components/ui/Card.tsx
import type { ReactNode, CSSProperties } from 'react';

export function Card({ children, hoverable, style, onClick, className = '' }: {
  children: ReactNode; hoverable?: boolean; style?: CSSProperties; onClick?: () => void; className?: string;
}) {
  return (
    <div onClick={onClick} className={`card ${hoverable ? 'hover' : ''} ${className}`}
      style={{ padding: 'clamp(16px, 3vw, 22px)', ...style }}>{children}</div>
  );
}

type BadgeVariant = 'primary' | 'green' | 'red' | 'yellow' | 'blue' | 'neutral' | 'acid';

const BADGE_STYLE: Record<BadgeVariant, CSSProperties> = {
  primary: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  green: { background: 'var(--success-soft)', color: 'var(--success)' },
  red: { background: 'var(--danger-soft)', color: 'var(--danger)' },
  yellow: { background: 'var(--warning-soft)', color: 'var(--warning)' },
  blue: { background: 'var(--info-soft)', color: 'var(--info)' },
  neutral: { background: 'var(--paper-2)', color: 'var(--ink-muted)' },
  acid: { background: 'var(--accent-soft)', color: 'var(--accent)' },
};

export function Badge({ children, variant = 'neutral', style }: { children: ReactNode; variant?: BadgeVariant; style?: CSSProperties }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 999,
      fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 600,
      letterSpacing: '-0.005em', whiteSpace: 'nowrap',
      border: '1px solid transparent', ...BADGE_STYLE[variant], ...style,
    }}>{children}</span>
  );
}
