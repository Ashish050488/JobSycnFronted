// FILE: src/pages/Trends/StatRibbon.tsx
// Four headline metrics in a compact ribbon. The momentum tile flips colour
// with the week-over-week direction.

import { motion } from 'framer-motion';
import { Briefcase, Sparkles, Activity, Building2 } from 'lucide-react';
import type { TrendsSummary } from './types';
import { COPY } from '../../theme/brand';
import { fmtNum } from './shared';

interface Props { summary: TrendsSummary; }

export default function StatRibbon({ summary }: Props) {
  const wowUp = summary.wowDelta > 0;
  const wowDown = summary.wowDelta < 0;
  const wowColor = wowUp ? 'var(--success)' : wowDown ? 'var(--danger)' : 'var(--ink)';
  const wowSign = wowUp ? '+' : '';

  const tiles = [
    { icon: <Briefcase size={15} />, label: COPY.trends.summaryTotalRoles, value: fmtNum(summary.totalActiveRoles), color: 'var(--ink)' },
    { icon: <Sparkles size={15} />, label: COPY.trends.summaryNewThisWeek, value: `+${fmtNum(summary.newThisWeek)}`, color: 'var(--accent)' },
    { icon: <Activity size={15} />, label: COPY.trends.summaryMomentum, value: `${wowSign}${fmtNum(summary.wowDelta)}`, color: wowColor, sub: `${summary.wowPercent > 0 ? '+' : ''}${summary.wowPercent}% vs last week` },
    { icon: <Building2 size={15} />, label: COPY.trends.summaryCompanies, value: fmtNum(summary.companiesTracked), color: 'var(--ink)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: 10, marginBottom: 16,
    }}>
      {tiles.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.06 }}
          className="card"
          style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--ink-muted)', fontSize: '0.74rem', fontWeight: 500 }}>
            <span style={{ display: 'inline-flex', color: t.color }}>{t.icon}</span>
            {t.label}
          </div>
          <div className="font-display" style={{
            fontSize: '1.7rem', fontWeight: 700, lineHeight: 1,
            letterSpacing: '-0.025em', color: t.color, fontVariantNumeric: 'tabular-nums',
          }}>{t.value}</div>
          {t.sub && <div style={{ fontSize: '0.7rem', color: 'var(--ink-faint)' }}>{t.sub}</div>}
        </motion.div>
      ))}
    </div>
  );
}
