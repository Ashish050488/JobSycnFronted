// FILE: src/pages/Trends/shared.tsx
// Small presentational helpers shared across the Trends charts.

import type { ReactNode } from 'react';

export function ChartCard({ title, subtitle, action, children, style }: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className="card"
      style={{ padding: 'clamp(16px, 3vw, 22px)', display: 'flex', flexDirection: 'column', ...style }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h2 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.015em' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.45 }}>{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

// A compact ▲/▼ trend chip.
export function TrendPill({ value, suffix = '%', size = 'sm' }: { value: number; suffix?: string; size?: 'sm' | 'md' }) {
  const up = value > 0;
  const down = value < 0;
  const color = up ? 'var(--success)' : down ? 'var(--danger)' : 'var(--ink-faint)';
  const bg = up ? 'var(--success-soft)' : down ? 'var(--danger-soft)' : 'var(--paper-2)';
  const arrow = up ? '▲' : down ? '▼' : '–';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: size === 'md' ? '4px 9px' : '2px 7px',
      borderRadius: 999, background: bg, color,
      fontSize: size === 'md' ? '0.78rem' : '0.7rem', fontWeight: 700,
      fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
    }}>
      {arrow} {value === 0 ? '0' : Math.abs(value)}{suffix}
    </span>
  );
}

export function fmtNum(n: number): string {
  return n.toLocaleString('en-IN');
}
