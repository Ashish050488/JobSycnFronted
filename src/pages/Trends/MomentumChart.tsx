// FILE: src/pages/Trends/MomentumChart.tsx
// Custom SVG momentum chart: daily new-role counts as a gradient area, with a
// 7-day moving-average line drawn on top. Hover reveals a crosshair + tooltip.
// No chart library — the path math is done by hand against a measured width.

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { DailyPoint } from './types';
import { fmtNum } from './shared';

interface Props { data: DailyPoint[]; }

const H = 260;
const PAD = { top: 18, right: 14, bottom: 26, left: 14 };

function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function MomentumChart({ data }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setW(entries[0].contentRect.width));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const counts = useMemo(() => data.map(d => d.count), [data]);
  const avg = useMemo(() => movingAverage(counts, 7), [counts]);
  const maxY = useMemo(() => Math.max(1, ...counts), [counts]);

  const plotW = Math.max(0, w - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const n = data.length;

  const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / maxY) * plotH;

  const { areaPath, linePath, avgPath, monthTicks } = useMemo(() => {
    if (!w || n === 0) return { areaPath: '', linePath: '', avgPath: '', monthTicks: [] as { x: number; label: string }[] };
    const line = counts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L ${x(n - 1).toFixed(1)} ${(PAD.top + plotH).toFixed(1)} L ${x(0).toFixed(1)} ${(PAD.top + plotH).toFixed(1)} Z`;
    const avgLine = avg.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

    const ticks: { x: number; label: string }[] = [];
    let lastMonth = '';
    data.forEach((d, i) => {
      const m = d.date.slice(0, 7);
      if (m !== lastMonth) {
        lastMonth = m;
        ticks.push({ x: x(i), label: new Date(`${d.date}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' }) });
      }
    });
    return { areaPath: area, linePath: line, avgPath: avgLine, monthTicks: ticks };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, n, counts, avg, maxY]);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!w || n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, (px - PAD.left) / (plotW || 1)));
    setHover(Math.round(ratio * (n - 1)));
  };

  const hp = hover != null ? data[hover] : null;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {w > 0 && n > 0 && (
        <svg
          width={w} height={H}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          style={{ display: 'block', touchAction: 'none' }}
        >
          <defs>
            <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* horizontal guide lines */}
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line
              key={f}
              x1={PAD.left} x2={w - PAD.right}
              y1={PAD.top + plotH - f * plotH} y2={PAD.top + plotH - f * plotH}
              stroke="var(--border)" strokeWidth={1} strokeDasharray="3 5" opacity={0.5}
            />
          ))}

          {/* month ticks */}
          {monthTicks.map((t, i) => (
            <text key={i} x={t.x} y={H - 8} fill="var(--ink-faint)" fontSize={10} textAnchor="middle">{t.label}</text>
          ))}

          {/* area */}
          <motion.path
            d={areaPath} fill="url(#momentumFill)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
          />
          {/* main line */}
          <motion.path
            d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2.2}
            strokeLinejoin="round" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
          {/* 7-day moving average */}
          <motion.path
            d={avgPath} fill="none" stroke="var(--ink-muted)" strokeWidth={1.4}
            strokeDasharray="5 4" opacity={0.8}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: 'easeInOut' }}
          />

          {/* hover crosshair */}
          {hp && hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--ink-faint)" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(hp.count)} r={4.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}

      {/* tooltip */}
      {hp && hover != null && (
        <div style={{
          position: 'absolute', top: 4,
          left: Math.min(Math.max(x(hover) - 60, 0), Math.max(0, w - 120)),
          width: 120, pointerEvents: 'none',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 9, padding: '7px 10px', boxShadow: 'var(--shadow-md, 0 6px 18px rgba(0,0,0,0.12))',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)' }}>{fmtDate(hp.date)}</div>
          <div className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
            {fmtNum(hp.count)} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--ink-muted)' }}>roles</span>
          </div>
        </div>
      )}

      {/* legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 4, fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 2.5, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} /> Daily new roles
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 0, borderTop: '2px dashed var(--ink-muted)', display: 'inline-block' }} /> 7-day average
        </span>
      </div>
    </div>
  );
}
