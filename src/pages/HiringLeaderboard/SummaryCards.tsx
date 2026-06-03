// FILE: src/pages/HiringLeaderboard/SummaryCards.tsx
import { TrendingUp, Briefcase, Flame, Clock } from 'lucide-react';
import LeaderboardSummaryCard from '../../components/LeaderboardSummaryCard';
import { COPY } from '../../theme/brand';

interface Props {
  totalNewThisWeek: number;
  totalActiveRoles: number;
  hiringFastCount: number;
  staleCount: number;
}

export default function SummaryCards({ totalNewThisWeek, totalActiveRoles, hiringFastCount, staleCount }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: 10, marginBottom: 24,
    }}>
      <LeaderboardSummaryCard icon={<TrendingUp size={16} />} label={COPY.leaderboard.summaryNewRoles} value={totalNewThisWeek} accent="success" />
      <LeaderboardSummaryCard icon={<Briefcase size={16} />} label={COPY.leaderboard.summaryTotalRoles} value={totalActiveRoles.toLocaleString()} accent="info" />
      <LeaderboardSummaryCard icon={<Flame size={16} />} label={COPY.leaderboard.summaryHiringFast} value={hiringFastCount} accent="warning" />
      <LeaderboardSummaryCard icon={<Clock size={16} />} label={COPY.leaderboard.summaryPossiblyStale} value={staleCount} accent="neutral" />
    </div>
  );
}
