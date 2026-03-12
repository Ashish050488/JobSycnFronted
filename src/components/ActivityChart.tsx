import { getDayBuckets, getGoalMetDays, getStreak, getThisWeekApplied, getWeekStart } from '../utils/progress';
import type { AppliedJobEntry } from '../types';

interface ActivityChartProps {
  appliedJobs: AppliedJobEntry[];
  dailyGoal: number;
  isMobile: boolean;
  barMaxHeight?: number;
}

export default function ActivityChart({ appliedJobs, dailyGoal, isMobile, barMaxHeight = 120 }: ActivityChartProps) {
  const buckets = getDayBuckets(appliedJobs, 7);
  const maxCount = Math.max(...buckets.map(bucket => bucket.count), 1);
  const hasApplications = buckets.some(bucket => bucket.count > 0);
  const streak = getStreak(appliedJobs);
  const goalMetDays = getGoalMetDays(appliedJobs, dailyGoal, 7);
  const thisWeekApplied = getThisWeekApplied(appliedJobs);
  const weekStart = getWeekStart();
  const weekRangeLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–today`;

  if (!hasApplications) {
    return (
      <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 18, padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.92rem', color: 'var(--muted-ink)' }}>No applications this week yet. Your weekly chart will show up here once you start applying.</div>
      </div>
    );
  }

  const chartHeight = barMaxHeight + 36;
  const barWidth = isMobile ? 28 : 38;
  const gap = isMobile ? 10 : 16;

  return (
    <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 18, padding: isMobile ? '22px 18px' : '24px 26px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div className="font-sketch" style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: 4 }}>Weekly Activity</div>
          <div style={{ fontSize: '0.86rem', color: 'var(--muted-ink)' }}>Applied to {thisWeekApplied} job{thisWeekApplied === 1 ? '' : 's'} this week ({weekRangeLabel})</div>
        </div>
        {streak > 0 && (
          <div style={{ fontSize: '0.84rem', color: 'var(--primary)', fontWeight: 700 }}>🔥 {streak}-day streak</div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap, height: chartHeight, marginBottom: 18, overflowX: 'auto', paddingBottom: 6 }}>
        {buckets.map(bucket => {
          const height = bucket.count === 0 ? 8 : Math.max(18, (bucket.count / maxCount) * barMaxHeight);
          const background = bucket.isToday ? 'var(--primary)' : bucket.count > 0 ? 'rgba(45,106,79,0.28)' : 'var(--border)';

          return (
            <div key={bucket.date.toISOString()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: barWidth }}>
              <div style={{ fontSize: '0.78rem', color: bucket.count > 0 ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: 700, marginBottom: 6, minHeight: 18 }}>
                {bucket.count > 0 ? bucket.count : ''}
              </div>
              <div style={{ width: barWidth, height, borderRadius: 8, background, transition: 'height 0.22s ease' }} />
              <div style={{ fontSize: '0.76rem', color: bucket.isToday ? 'var(--ink)' : 'var(--muted-ink)', fontWeight: bucket.isToday ? 700 : 500, marginTop: 8 }}>
                {bucket.dayName}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', fontSize: '0.84rem', color: 'var(--muted-ink)' }}>
        <span>⭐ Hit goal {goalMetDays} of last 7 days</span>
        <span>Goal: {dailyGoal}/day</span>
      </div>
    </div>
  );
}