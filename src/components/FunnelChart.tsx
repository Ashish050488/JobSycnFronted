import { useState, useEffect } from 'react';
import { MessageSquare, Users, Clock, EyeOff } from 'lucide-react';
import { STAGES, STAGE_ORDER } from './PipelineCard';
import type { StageName } from './PipelineCard';

type ReactElement = import('react').ReactElement;

interface FunnelChartProps {
  stageCounts: Record<string, number>;
  totalApplied: number;
}

const POSITIVE_STAGES: StageName[] = ['applied', 'screening', 'interview', 'offer', 'accepted'];
const NEGATIVE_STAGES: StageName[] = ['rejected', 'ghosted'];

function getMaxCount(stageCounts: Record<string, number>): number {
  let max = 1;
  for (const s of STAGE_ORDER) {
    max = Math.max(max, stageCounts[s] || 0);
  }
  return max;
}

export default function FunnelChart({ stageCounts, totalApplied }: FunnelChartProps) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 480 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 480);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const maxCount = getMaxCount(stageCounts);
  const conversionIndent = isMobile ? 72 : 102;

  // Empty state
  if (totalApplied === 0) {
    return (
      <div style={{ fontSize: '0.88rem', color: 'var(--muted-ink)', padding: 40, textAlign: 'center' }}>
        Apply to some jobs to see your pipeline stats here.
      </div>
    );
  }

  // ─── Bar renderer ──────────────────────────────────────────────
  function renderBar(stage: StageName, index: number) {
    const count = stageCounts[stage] || 0;
    const stageCfg = STAGES[stage];
    const percent = totalApplied > 0 ? Math.round((count / totalApplied) * 100) : 0;
    const isEmpty = count === 0;

    return (
      <div key={stage} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        {/* Label */}
        <div style={{
          width: isMobile ? 60 : 90, textAlign: 'right', fontSize: isMobile ? '0.75rem' : '0.82rem',
          color: isEmpty ? 'var(--subtle-ink)' : 'var(--muted-ink)',
          marginRight: 12, opacity: isEmpty ? 0.6 : 1,
        }}>
          {stageCfg.label}
        </div>
        {/* Bar container */}
        <div style={{
          flex: 1, height: 36, borderRadius: 8, position: 'relative', overflow: 'hidden',
          marginRight: 12,
          background: isEmpty ? 'transparent' : stageCfg.bg,
          border: isEmpty ? '1.5px dashed var(--border)' : 'none',
        }}>
          {!isEmpty && (
            <div
              style={{
                height: '100%',
                borderRadius: 8,
                background: stageCfg.color,
                opacity: 0.55,
                width: `${(count / maxCount) * 100}%`,
                minWidth: 4,
                transform: visible ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: `transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
              }}
            />
          )}
        </div>
        {/* Count */}
        <div style={{
          width: 36, textAlign: 'right', fontSize: '0.88rem', fontWeight: 500,
          color: isEmpty ? 'var(--subtle-ink)' : stageCfg.color,
          marginRight: 8, opacity: isEmpty ? 0.5 : 1,
        }}>
          {count}
        </div>
        {/* Percentage */}
        <div style={{
          width: 48, textAlign: 'right', fontSize: '0.78rem',
          color: 'var(--subtle-ink)', opacity: isEmpty ? 0.5 : 1,
        }}>
          {percent}%
        </div>
      </div>
    );
  }

  // ─── Conversion arrow ──────────────────────────────────────────
  function renderConversionArrow(currentCount: number, nextCount: number, index: number) {
    if (currentCount > 0 && nextCount > 0) {
      const pct = Math.round((nextCount / currentCount) * 100);
      return (
        <div key={`arrow-${index}`} style={{ fontSize: '0.72rem', color: 'var(--subtle-ink)', margin: `2px 0 6px ${conversionIndent}px` }}>
          ↓ {pct}% moved forward
        </div>
      );
    }
    if (currentCount > 0 && nextCount === 0) {
      return (
        <div key={`arrow-${index}`} style={{ fontSize: '0.72rem', color: 'var(--subtle-ink)', margin: `2px 0 6px ${conversionIndent}px`, opacity: 0.4 }}>
          ↓ —
        </div>
      );
    }
    return null;
  }

  // ─── Build bars ────────────────────────────────────────────────
  const positiveBars: ReactElement[] = [];
  let barIndex = 0;
  for (let i = 0; i < POSITIVE_STAGES.length; ++i) {
    const stage = POSITIVE_STAGES[i];
    positiveBars.push(renderBar(stage, barIndex));
    barIndex++;
    // Conversion arrow between consecutive stages
    if (i < POSITIVE_STAGES.length - 1) {
      const currentCount = stageCounts[stage] || 0;
      const nextCount = stageCounts[POSITIVE_STAGES[i + 1]] || 0;
      const arrow = renderConversionArrow(currentCount, nextCount, i);
      if (arrow) positiveBars.push(arrow);
    }
  }

  const negativeBars: ReactElement[] = [];
  for (let i = 0; i < NEGATIVE_STAGES.length; ++i) {
    const stage = NEGATIVE_STAGES[i];
    const count = stageCounts[stage] || 0;
    if (count === 0) continue; // Only show negative stages if they have counts
    negativeBars.push(renderBar(stage, barIndex));
    barIndex++;
  }

  const hasNegative = negativeBars.length > 0;

  // ─── Stat calculations ────────────────────────────────────────
  const responseNum = (stageCounts['screening'] || 0) + (stageCounts['interview'] || 0) + (stageCounts['offer'] || 0) + (stageCounts['accepted'] || 0);
  const interviewNum = (stageCounts['interview'] || 0) + (stageCounts['offer'] || 0) + (stageCounts['accepted'] || 0);
  const ghostNum = stageCounts['ghosted'] || 0;

  const responseRate = totalApplied > 0 && responseNum > 0 ? Math.round((responseNum / totalApplied) * 100) : null;
  const interviewRate = totalApplied > 0 && interviewNum > 0 ? Math.round((interviewNum / totalApplied) * 100) : null;
  const ghostRate = totalApplied > 0 && ghostNum > 0 ? Math.round((ghostNum / totalApplied) * 100) : null;

  const stats = [
    {
      icon: <MessageSquare size={16} />,
      value: responseRate !== null ? `${responseRate}%` : '—',
      label: responseRate !== null ? 'Response rate' : 'No responses yet',
      color: 'var(--primary)',
    },
    {
      icon: <Users size={16} />,
      value: interviewRate !== null ? `${interviewRate}%` : '—',
      label: interviewRate !== null ? 'Interview rate' : 'No interviews yet',
      color: '#534AB7',
    },
    {
      icon: <Clock size={16} />,
      value: '—',
      label: 'Avg response time',
      color: 'var(--muted-ink)',
    },
    {
      icon: <EyeOff size={16} />,
      value: ghostRate !== null ? `${ghostRate}%` : '✓',
      label: ghostRate !== null ? 'Ghost rate' : 'No ghosting yet',
      color: ghostRate !== null ? 'var(--danger)' : 'var(--success)',
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}>
      {/* Funnel bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 24 }}>
        {positiveBars}
        {hasNegative && (
          <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />
        )}
        {negativeBars}
      </div>

      {/* Stat cards grid */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
          gap: 12,
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              background: 'var(--paper2)',
              borderRadius: 10,
              padding: '14px 12px',
              textAlign: 'center',
            }}>
              <div style={{ color: stat.color, opacity: 0.6, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--subtle-ink)', marginTop: 3, lineHeight: 1.3 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
