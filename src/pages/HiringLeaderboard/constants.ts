// FILE: src/pages/HiringLeaderboard/constants.ts
import type { SignalConfig } from '../../components/LeaderboardRow';
import { COPY } from '../../theme/brand';

export const SIGNAL: Record<string, SignalConfig> = {
  hot: { label: 'Hiring fast', color: 'var(--danger)', bg: 'var(--danger-soft)', dot: 'var(--danger)' },
  active: { label: 'Actively hiring', color: 'var(--accent)', bg: 'var(--accent-soft)', dot: 'var(--accent)' },
  steady: { label: 'Steady', color: 'var(--info)', bg: 'var(--info-soft)', dot: 'var(--info)' },
  stale: { label: 'Possibly stale', color: 'var(--ink-muted)', bg: 'var(--paper-2)', dot: 'var(--ink-faint)' },
};

export const FILTER_OPTIONS = [
  { value: 'all', label: COPY.leaderboard.filterAll },
  { value: 'hot', label: 'Hot' },
  { value: 'active', label: 'Active' },
  { value: 'steady', label: 'Steady' },
  { value: 'stale', label: 'Stale' },
];

export const SORT_OPTIONS = [
  { value: 'newThisWeek', label: COPY.leaderboard.sortNewThisWeek },
  { value: 'totalRoles', label: COPY.leaderboard.sortTotalRoles },
  { value: 'freshest', label: COPY.leaderboard.sortFreshest },
  { value: 'stale', label: COPY.leaderboard.sortMostStale },
];
