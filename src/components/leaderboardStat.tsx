// FILE: src/components/leaderboardStat.tsx
// Tiny presentational sub-component for the leaderboard's expanded row stats.

export default function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '8px 10px', background: 'var(--paper-2)', borderRadius: 8 }}>
      <div style={{ fontSize: '0.66rem', color: 'var(--ink-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--ink)', fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}
