// FILE: src/components/ActivityChart.tsx
import type { AppliedJobEntry } from '../types';
import {
  getDayBuckets, getGoalMetDays, getThisWeekApplied, getWeekStart, getStreak,
} from '../utils/progress';

interface Props {
  appliedJobs: AppliedJobEntry[];
  dailyGoal: number;
}

export default function ActivityChart({ appliedJobs, dailyGoal }: Props) {
  const buckets = getDayBuckets(appliedJobs, 7);
  const weekTotal = getThisWeekApplied(appliedJobs);
  const goalMet = getGoalMetDays(appliedJobs, dailyGoal, 7);
  const streak = getStreak(appliedJobs);
  const max = Math.max(...buckets.map(b => b.count), dailyGoal, 1);

  return (
    <div>
      {/* Stat row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 10, marginBottom: 18,
      }}>
        <Stat label="This week" value={weekTotal} suffix="applied" />
        <Stat label="Goal-met days" value={goalMet} suffix={`/ ${7}`} accent={goalMet >= 4} />
        <Stat label="Current streak" value={streak} suffix={streak === 1 ? 'day' : 'days'} accent={streak > 0} />
      </div>

      {/* Bars */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        height: 160,
        padding: '12px 4px 0',
        borderBottom: '1px dashed var(--border)',
      }}>
        {buckets.map((b, i) => {
          const h = Math.max(4, (b.count / max) * 130);
          const isMet = b.count >= dailyGoal && b.count > 0;
          const isEmpty = b.count === 0;
          return (
            <div key={i} style={{
              flex: 1,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end',
              gap: 6, height: '100%', minWidth: 0,
            }}>
              {!isEmpty && (
                <div style={{
                  fontSize: '0.7rem', fontWeight: 600,
                  color: isMet ? 'var(--success)' : 'var(--ink-muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}>{b.count}</div>
              )}
              <div style={{
                width: '100%', maxWidth: 32,
                height: h,
                borderRadius: '8px 8px 4px 4px',
                background: isEmpty ? 'var(--paper-2)' : isMet ? 'var(--success)' : 'var(--accent)',
                opacity: b.isToday ? 1 : isEmpty ? 1 : 0.75,
                border: b.isToday ? '1.5px solid var(--ink)' : 'none',
                transition: 'all 240ms cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>
          );
        })}
      </div>
      {/* Day labels */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 4px 0',
      }}>
        {buckets.map((b, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: '0.7rem',
            color: b.isToday ? 'var(--ink)' : 'var(--ink-muted)',
            fontWeight: b.isToday ? 600 : 500,
            minWidth: 0,
          }}>
            {b.dayName.slice(0, 3)}
          </div>
        ))}
      </div>
      <div style={{ display: 'none' }}>{getWeekStart().toISOString()}</div>
    </div>
  );
}

function Stat({ label, value, suffix, accent }: { label: string; value: number; suffix: string; accent?: boolean }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--paper-2)',
      borderRadius: 10,
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <span className="font-display" style={{
          fontSize: '1.35rem', fontWeight: 600,
          color: accent ? 'var(--success)' : 'var(--ink)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>{value}</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{suffix}</span>
      </div>
    </div>
  );
}
