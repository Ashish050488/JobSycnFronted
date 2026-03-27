import { useMemo } from 'react';
import type { AppliedJobEntry } from '../types';

interface HeatmapCalendarProps {
  appliedJobs: AppliedJobEntry[];
  dailyGoal: number;
}

interface DayData {
  date: Date;
  dateStr: string;
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

/* ─── helpers ──────────────────────────────────────────────── */

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDailyCounts(jobs: AppliedJobEntry[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    if (!job.appliedAt) continue;
    const d = new Date(job.appliedAt);
    if (isNaN(d.getTime())) continue;
    const key = dateKey(d);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function computeSmartStreak(countMap: Map<string, number>, dailyGoal: number): number {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const dayOfWeek = cursor.getDay();
  if ((dayOfWeek === 0 || dayOfWeek === 6) && !(countMap.get(dateKey(cursor)))) {
    while (cursor.getDay() !== 5) {
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  while (true) {
    const key = dateKey(cursor);
    const dow = cursor.getDay();
    const isWeekend = dow === 0 || dow === 6;
    if (isWeekend) {
      if ((countMap.get(key) || 0) > 0) streak++;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if ((countMap.get(key) || 0) < dailyGoal) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function getCellStyle(count: number, goal: number): { bg: string; border?: string } {
  if (count === 0) return { bg: 'var(--border)' };
  const ratio = count / Math.max(goal, 1);
  if (ratio < 0.5) return { bg: 'var(--primary-soft)' };
  if (ratio < 1) return { bg: 'var(--success-soft)', border: 'var(--success)' };
  if (ratio >= 1 && count === goal) return { bg: 'var(--success)' };
  return { bg: 'var(--primary)' };
}

function buildGrid(dailyCounts: Map<string, number>): DayData[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  const todayDow = today.getDay();
  const daysUntilSunday = todayDow === 0 ? 0 : 7 - todayDow;
  endDate.setDate(endDate.getDate() + daysUntilSunday);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (13 * 7 - 1));

  const weeks: DayData[][] = [];
  const cursor = new Date(startDate);

  for (let w = 0; w < 13; w++) {
    const week: DayData[] = [];
    for (let d = 0; d < 7; d++) {
      const dCopy = new Date(cursor);
      const dStr = dateKey(dCopy);
      const isToday = dCopy.getTime() === today.getTime();
      const isFuture = dCopy > today;
      week.push({
        date: dCopy,
        dateStr: dStr,
        count: isFuture ? 0 : (dailyCounts.get(dStr) || 0),
        isToday,
        isFuture,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/* ─── component ────────────────────────────────────────────── */

export default function HeatmapCalendar({ appliedJobs, dailyGoal }: HeatmapCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dailyCounts = useMemo(() => getDailyCounts(appliedJobs), [appliedJobs]);
  const streak = useMemo(() => computeSmartStreak(dailyCounts, dailyGoal), [dailyCounts, dailyGoal]);
  const grid = useMemo(() => buildGrid(dailyCounts), [dailyCounts]);

  // Total applications in last 90 days
  const total90 = useMemo(() => {
    let total = 0;
    for (const week of grid) {
      for (const day of week) {
        if (!day.isFuture) total += day.count;
      }
    }
    return total;
  }, [grid]);

  function shouldShowMonthLabel(weekIndex: number): boolean {
    if (weekIndex === 0) return true;
    const thisMonth = grid[weekIndex][0]?.date.getMonth();
    const prevMonth = grid[weekIndex - 1]?.[0]?.date.getMonth();
    return thisMonth !== prevMonth;
  }

  const appliedThisWeek = useMemo(() => {
    const weekStart = new Date(today);
    const dow = today.getDay();
    weekStart.setDate(today.getDate() - ((dow + 6) % 7));
    let count = 0;
    for (let d = new Date(weekStart); d <= today; d.setDate(d.getDate() + 1)) {
      count += dailyCounts.get(dateKey(d)) || 0;
    }
    return count;
  }, [today, dailyCounts]);

  const goalMetDays = useMemo(() => {
    let met = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (dailyGoal > 0 && (dailyCounts.get(dateKey(d)) || 0) >= dailyGoal) met++;
    }
    return met;
  }, [today, dailyCounts, dailyGoal]);

  const legendLevels = [
    { bg: 'var(--border)' },
    { bg: 'var(--primary-soft)' },
    { bg: 'var(--success-soft)' },
    { bg: 'var(--success)' },
    { bg: 'var(--primary)' },
  ];

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
  const CELL = 14;
  const GAP = 3;

  return (
    <div style={{ width: '100%', maxWidth: 560, margin: '0 auto' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="font-sketch" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--primary)' }}>Activity</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--subtle-ink)' }}>• {total90} applications</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted-ink)', marginTop: 2 }}>Last 90 days</div>
        </div>
        <div>
          {streak > 0 ? (
            <span style={{ background: 'var(--warning-soft)', color: 'var(--warning)', borderRadius: 999, padding: '4px 12px', fontSize: '0.82rem', fontWeight: 600 }}>
              🔥 {streak}-day streak
            </span>
          ) : (
            <span style={{ background: 'var(--paper2)', color: 'var(--muted-ink)', borderRadius: 999, padding: '4px 12px', fontSize: '0.82rem', fontWeight: 600 }}>
              No streak yet
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'flex', gap: GAP }}>
          {/* Day labels column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: 18 }}>
            {dayLabels.map((label, i) => (
              <div key={i} style={{
                width: 28, height: CELL, fontSize: '0.68rem',
                color: 'var(--subtle-ink)', textAlign: 'right', lineHeight: `${CELL}px`,
              }}>
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {grid.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
              {/* Month label */}
              <div style={{ height: 15, fontSize: '0.68rem', color: 'var(--subtle-ink)', lineHeight: '15px' }}>
                {shouldShowMonthLabel(wi)
                  ? week[0].date.toLocaleString('default', { month: 'short' })
                  : ''}
              </div>
              {/* 7 day cells */}
              {week.map((day, di) => {
                const cs = getCellStyle(day.count, dailyGoal);
                const isMet = day.count > 0 && day.count >= dailyGoal;
                return (
                  <div
                    key={di}
                    title={day.isFuture ? '' : `${formatDate(day.date)}: ${day.count === 0 ? 'No applications' : day.count + ' application' + (day.count !== 1 ? 's' : '')}`}
                    style={{
                      width: CELL, height: CELL, borderRadius: 3,
                      background: day.isFuture ? 'transparent' : cs.bg,
                      border: day.isToday
                        ? '2px solid var(--primary)'
                        : (isMet && cs.border ? `1px solid ${cs.border}` : '1px solid transparent'),
                      cursor: day.isFuture ? 'default' : 'pointer',
                      boxSizing: 'border-box',
                      transition: 'transform 0.15s',
                    }}
                    onMouseEnter={e => { if (!day.isFuture) e.currentTarget.style.transform = 'scale(1.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend + summary stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: 'var(--subtle-ink)' }}>
          <span>Less</span>
          {legendLevels.map((level, i) => (
            <span key={i} style={{
              width: 12, height: 12, borderRadius: 3, background: level.bg,
              display: 'inline-block', border: '1px solid var(--border)',
            }} />
          ))}
          <span>More</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--muted-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{appliedThisWeek} applied this week</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>Goal met {goalMetDays} of last 7 days</span>
        </div>
      </div>
    </div>
  );
}

export { computeSmartStreak, dateKey };
