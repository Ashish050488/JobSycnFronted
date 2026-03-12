import { useEffect, useMemo, useState } from 'react';

interface ProgressRingProps {
  todayCount: number;
  dailyGoal: number;
  onGoalChange: (goal: number) => Promise<void> | void;
  size?: number;
}

export default function ProgressRing({ todayCount, dailyGoal, onGoalChange, size = 80 }: ProgressRingProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(String(dailyGoal));

  useEffect(() => {
    setGoalInput(String(dailyGoal));
  }, [dailyGoal]);

  const strokeWidth = size >= 80 ? 6 : 4;
  const radius = (size - 2 * strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = dailyGoal > 0 ? Math.min(todayCount / dailyGoal, 1) : 0;
  const offset = circumference - progress * circumference;
  const ringColor = todayCount >= dailyGoal ? '#40916C' : 'var(--primary)';

  const percentageLabel = useMemo(() => {
    if (dailyGoal <= 0) return '0%';
    return `${Math.min(100, Math.round((todayCount / dailyGoal) * 100))}%`;
  }, [todayCount, dailyGoal]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextGoal = Math.max(1, Math.min(50, parseInt(goalInput, 10) || dailyGoal || 5));
    setGoalInput(String(nextGoal));
    await onGoalChange(nextGoal);
    setEditorOpen(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={2} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.25s ease, stroke 0.25s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: size >= 80 ? '1rem' : '0.78rem', fontWeight: 700, color: ringColor, lineHeight: 1 }}>{todayCount}</div>
          <div style={{ fontSize: size >= 80 ? '0.7rem' : '0.62rem', color: 'var(--muted-ink)', lineHeight: 1.1 }}>{percentageLabel}</div>
        </div>
      </div>

      {editorOpen ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            type="number"
            min="1"
            max="50"
            value={goalInput}
            onChange={event => setGoalInput(event.target.value)}
            autoFocus
            style={{ width: 68, padding: '7px 9px', borderRadius: 8, border: '1.25px solid var(--primary)', background: 'var(--surface-solid)', color: 'var(--ink)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
            Save
          </button>
          <button type="button" onClick={() => { setGoalInput(String(dailyGoal)); setEditorOpen(false); }} style={{ padding: '7px 12px', borderRadius: 8, border: '1.25px solid var(--border)', background: 'transparent', color: 'var(--muted-ink)', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </form>
      ) : (
        <button onClick={() => setEditorOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
          Edit goal
        </button>
      )}
    </div>
  );
}