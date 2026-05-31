// FILE: src/components/LeaderboardSummaryCard.tsx
interface Props {
  label: string;
  value: number | string;
  delta?: string;
  icon?: React.ReactNode;
  accent?: 'success' | 'warning' | 'info' | 'neutral';
}

export default function LeaderboardSummaryCard({ label, value, delta, icon, accent = 'neutral' }: Props) {
  const accentColor = {
    success: 'var(--success)',
    warning: 'var(--warning)',
    info: 'var(--info)',
    neutral: 'var(--ink-muted)',
  }[accent];

  const accentBg = {
    success: 'var(--success-soft)',
    warning: 'var(--warning-soft)',
    info: 'var(--info-soft)',
    neutral: 'var(--paper-2)',
  }[accent];

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      {icon && (
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: accentBg,
          color: accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>{icon}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="font-display" style={{
            fontSize: '1.35rem',
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            marginTop: 4,
          }}>{value}</span>
          {delta && <span style={{ fontSize: '0.72rem', color: accentColor, fontWeight: 600 }}>{delta}</span>}
        </div>
      </div>
    </div>
  );
}
