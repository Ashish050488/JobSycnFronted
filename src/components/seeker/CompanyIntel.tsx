// FILE: src/components/CompanyIntel.tsx
// Strip showing freshness, posting cadence, and stats for a company.
import { useEffect, useState } from 'react';
import { TrendingUp, Clock, Briefcase } from 'lucide-react';

interface IntelData {
  totalRoles: number;
  newThisWeek: number;
  avgAgeDays: number;
  stalePercent: number;
  signal: 'hot' | 'active' | 'steady' | 'stale';
  weekOverWeek?: number;
}
const cache = new Map<string, IntelData | null>();

interface Props { companyName: string; }

const SIGNAL = {
  hot: { label: 'Hiring fast', color: 'var(--danger)', bg: 'var(--danger-soft)' },
  active: { label: 'Actively hiring', color: 'var(--accent)', bg: 'var(--accent-soft)' },
  steady: { label: 'Steady', color: 'var(--info)', bg: 'var(--info-soft)' },
  stale: { label: 'Possibly stale', color: 'var(--ink-muted)', bg: 'var(--paper-2)' },
};

export default function CompanyIntel({ companyName }: Props) {
  const [data, setData] = useState<IntelData | null>(cache.has(companyName) ? cache.get(companyName)! : null);
  const [loading, setLoading] = useState(!cache.has(companyName));

  useEffect(() => {
    if (cache.has(companyName)) { setData(cache.get(companyName)!); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/jobs/company-intel/${encodeURIComponent(companyName)}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: IntelData | null) => { if (!cancelled) { cache.set(companyName, d); setData(d); } })
      .catch(() => { cache.set(companyName, null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [companyName]);

  if (loading) return <div className="skeleton" style={{ height: 60, borderRadius: 10, margin: '8px 0' }} />;
  if (!data) return null;
  const sig = SIGNAL[data.signal];

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 8,
      padding: '10px 12px',
      background: 'var(--paper-2)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      margin: '12px 0',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 999,
        background: sig.bg, color: sig.color,
        fontSize: '0.74rem', fontWeight: 600,
      }}>
        <TrendingUp size={11} />{sig.label}
      </span>
      <Stat icon={<Briefcase size={11} />} label={`${data.totalRoles} open`} />
      <Stat icon={<TrendingUp size={11} />} label={`+${data.newThisWeek} this week`} accent />
      <Stat icon={<Clock size={11} />} label={`${data.avgAgeDays}d avg age`} />
    </div>
  );
}

function Stat({ icon, label, accent }: { icon: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 9px', borderRadius: 999,
      background: 'var(--surface)',
      color: accent ? 'var(--accent)' : 'var(--ink-muted)',
      border: '1px solid var(--border)',
      fontSize: '0.74rem', fontWeight: 500,
    }}>
      {icon}{label}
    </span>
  );
}
