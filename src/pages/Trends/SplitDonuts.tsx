// FILE: src/pages/Trends/SplitDonuts.tsx
// Two custom SVG donuts side by side: open roles by experience band and by
// workplace type. Arcs animate in from zero length.

import { motion } from 'framer-motion';
import { SERIES_COLORS } from './types';
import { fmtNum } from './shared';

interface Slice { label: string; count: number; }

const SIZE = 150;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

function Donut({ title, data }: { title: string; data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  let offset = 0;
  const slices = data.map((d, i) => {
    const frac = d.count / total;
    const seg = { ...d, color: SERIES_COLORS[i % SERIES_COLORS.length], frac, dash: frac * C, offset: offset * C };
    offset += frac;
    return seg;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: '1 1 240px', minWidth: 0 }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-muted)', letterSpacing: '0.02em' }}>{title}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
          <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--paper-2)" strokeWidth={STROKE} />
            {slices.map((s, i) => (
              <motion.circle
                key={s.label}
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                fill="none" stroke={s.color} strokeWidth={STROKE}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-s.offset}
                initial={{ strokeDasharray: `0 ${C}` }}
                animate={{ strokeDasharray: `${s.dash} ${C - s.dash}` }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
              />
            ))}
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <span className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
              {fmtNum(total)}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--ink-faint)' }}>roles</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0, flex: 1 }}>
          {slices.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.label}</span>
              <span style={{ color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(s.frac * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Props {
  experience: { band: string; count: number }[];
  workplace: { type: string; count: number }[];
  experienceTitle: string;
  workplaceTitle: string;
}

export default function SplitDonuts({ experience, workplace, experienceTitle, workplaceTitle }: Props) {
  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
      <Donut title={experienceTitle} data={experience.slice(0, 6).map(e => ({ label: e.band, count: e.count }))} />
      <Donut title={workplaceTitle} data={workplace.slice(0, 5).map(w => ({ label: w.type, count: w.count }))} />
    </div>
  );
}
