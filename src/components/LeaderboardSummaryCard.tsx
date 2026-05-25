import { TrendingUp, TrendingDown } from 'lucide-react';

// Compact inline stat — used in the horizontal stat strip
export function LeaderboardSummaryCard({ value, label, delta, accent, icon }: {
  value: number; label: string; delta?: number; accent?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px',
      borderRight: '1px solid var(--border)',
      flex: 1,
      minWidth: 0,
    }}>
      {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
          <span className="font-sketch-num" style={{
            fontSize: accent ? '1.6rem' : '1.3rem',
            fontWeight: 700,
            color: accent ? 'var(--primary)' : 'var(--ink)',
            lineHeight: 1,
          }}>
            {value.toLocaleString('en-IN')}
          </span>
          {delta !== undefined && delta !== 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 2,
              fontSize: '0.68rem', fontWeight: 700,
              color: delta > 0 ? 'var(--success)' : 'var(--danger)',
            }}>
              {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </div>
        <div style={{
          fontSize: '0.68rem', color: 'var(--subtle-ink)',
          marginTop: 2, whiteSpace: 'nowrap',
          textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}
