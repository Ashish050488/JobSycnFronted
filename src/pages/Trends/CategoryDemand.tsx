// FILE: src/pages/Trends/CategoryDemand.tsx
// Animated horizontal bars — one per role category. Bar length is the category's
// share of all open roles; the trailing chip shows its week-over-week shift.

import { motion } from 'framer-motion';
import type { CategoryTrend } from './types';
import { SERIES_COLORS } from './types';
import { TrendPill, fmtNum } from './shared';

interface Props { categories: CategoryTrend[]; }

export default function CategoryDemand({ categories }: Props) {
  const maxShare = Math.max(1, ...categories.map(c => c.share));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {categories.map((c, i) => (
        <div key={c.category}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6, gap: 10 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.category}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {fmtNum(c.totalRoles)} <span style={{ color: 'var(--ink-faint)' }}>· {c.share}%</span>
              </span>
              <TrendPill value={c.trendPercent} />
            </span>
          </div>
          <div style={{ height: 9, borderRadius: 999, background: 'var(--paper-2)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(c.share / maxShare) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: 999,
                background: `linear-gradient(90deg, ${SERIES_COLORS[i % SERIES_COLORS.length]}, ${SERIES_COLORS[i % SERIES_COLORS.length]}cc)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
