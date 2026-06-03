// FILE: src/pages/HiringLeaderboard/Methodology.tsx
import type { LeaderboardCompany } from '../../components/LeaderboardRow';
import { COPY } from '../../theme/brand';

interface Props { companies: LeaderboardCompany[]; }

export default function Methodology({ companies }: Props) {
  const totalUnknown = companies.reduce((s, c) => s + (c.unknownDateCount || 0), 0);
  return (
    <div style={{
      marginTop: 40, padding: 18,
      background: 'var(--paper-2)',
      border: '1px solid var(--border)', borderRadius: 12,
      fontSize: '0.82rem', color: 'var(--ink-muted)', lineHeight: 1.6,
    }}>
      <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
        {COPY.leaderboard.methodologyTitle}
      </p>
      {COPY.leaderboard.methodologyBody}
      {totalUnknown > 0 && (
        <p style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <strong>Note:</strong> {totalUnknown.toLocaleString()} role{totalUnknown === 1 ? '' : 's'} on this page don't have a real "posted" date — Greenhouse's public API doesn't expose one. Those roles count toward "total active" but not toward "new this week" or trend signals.
        </p>
      )}
    </div>
  );
}
