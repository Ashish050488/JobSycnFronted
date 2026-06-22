// FILE: src/pages/Trends/Movers.tsx
// Two ranked columns of companies by week-over-week change — ramping up vs
// slowing down. Each row has a bar proportional to the size of the swing.

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Mover } from './types';
import { COPY } from '../../theme/brand';

function Column({ title, movers, dir }: { title: string; movers: Mover[]; dir: 'up' | 'down' }) {
  const up = dir === 'up';
  const color = up ? 'var(--success)' : 'var(--danger)';
  const soft = up ? 'var(--success-soft)' : 'var(--danger-soft)';
  const maxAbs = Math.max(1, ...movers.map(m => Math.abs(m.delta)));

  return (
    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, color }}>
        {up ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{title}</span>
      </div>
      {movers.length === 0 ? (
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>No movement this week.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {movers.map((m, i) => (
            <div key={m.company} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.84rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.company}
              </span>
              <div style={{ width: '38%', maxWidth: 120, height: 8, borderRadius: 999, background: 'var(--paper-2)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(Math.abs(m.delta) / maxAbs) * 100}%` }}
                  transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 999, background: color, marginLeft: up ? 0 : 'auto' }}
                />
              </div>
              <span style={{
                flexShrink: 0, minWidth: 38, textAlign: 'right',
                fontSize: '0.78rem', fontWeight: 700, color, background: soft,
                borderRadius: 999, padding: '2px 8px', fontVariantNumeric: 'tabular-nums',
              }}>
                {up ? '+' : ''}{m.delta}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props { gaining: Mover[]; cooling: Mover[]; }

export default function Movers({ gaining, cooling }: Props) {
  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
      <Column title={COPY.trends.moversGaining} movers={gaining} dir="up" />
      <Column title={COPY.trends.moversCooling} movers={cooling} dir="down" />
    </div>
  );
}
