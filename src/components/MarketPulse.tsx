// FILE: src/components/MarketPulse.tsx
// Simplified bars view (mobile + desktop). Same fetch.
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { roleBadgeStyle } from './JobDetailPanel';

interface CategoryData {
  category: string;
  totalRoles: number;
  newThisWeek: number;
  trendPercent: number;
  trend: 'up' | 'down' | 'stable';
}
interface MarketPulseData { categories: CategoryData[]; totalJobs: number; updatedAt: string; }
let sessionCache: MarketPulseData | null = null;

export default function MarketPulse() {
  const [data, setData] = useState<MarketPulseData | null>(sessionCache);
  const [loading, setLoading] = useState(!sessionCache);

  useEffect(() => {
    if (sessionCache) return;
    let cancelled = false;
    fetch('/api/jobs/market-pulse')
      .then(r => r.ok ? r.json() : null)
      .then((d: MarketPulseData | null) => { if (!cancelled && d) { sessionCache = d; setData(d); } })
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section style={{ padding: '48px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
          <div className="skeleton" style={{ height: 240, borderRadius: 14 }} />
        </div>
      </section>
    );
  }
  if (!data || data.categories.length === 0) return null;

  const max = Math.max(...data.categories.map(c => c.totalRoles), 1);

  return (
    <section style={{ padding: '56px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
          Market pulse
        </p>
        <h2 className="font-display" style={{
          fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
          fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.025em', marginBottom: 6,
        }}>
          What&apos;s hot in Indian tech hiring
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 24 }}>
          {data.totalJobs.toLocaleString()} active roles across categories.
        </p>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 18,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {data.categories.map((cat) => {
            const { color, bg } = roleBadgeStyle(cat.category);
            const pct = (cat.totalRoles / max) * 100;
            const TrendIcon = cat.trend === 'up' ? TrendingUp : cat.trend === 'down' ? TrendingDown : Minus;
            const trendColor = cat.trend === 'up' ? 'var(--success)' : cat.trend === 'down' ? 'var(--warning)' : 'var(--ink-faint)';
            return (
              <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.78rem', padding: '3px 10px', borderRadius: 999,
                  background: bg, color: color, fontWeight: 600,
                  minWidth: 130, textAlign: 'center',
                }}>{cat.category}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--paper-2)', borderRadius: 999, overflow: 'hidden', minWidth: 100 }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: color, borderRadius: 999,
                    transition: 'width 800ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
                <span style={{
                  fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)',
                  fontVariantNumeric: 'tabular-nums', minWidth: 38, textAlign: 'right',
                }}>{cat.totalRoles}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: '0.74rem', color: trendColor, fontWeight: 600,
                  minWidth: 56, justifyContent: 'flex-end',
                }}>
                  <TrendIcon size={11} />
                  {cat.trendPercent === 100 && cat.trend === 'up' ? 'new' : cat.trend === 'stable' ? '—' : `${Math.abs(cat.trendPercent)}%`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
