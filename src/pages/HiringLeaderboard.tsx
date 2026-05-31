// FILE: src/pages/HiringLeaderboard.tsx
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flame, TrendingUp, Briefcase, Clock, Share2 } from 'lucide-react';
import { Container, PageHeader, Button, EmptyState } from '../components/ui';
import LeaderboardRow, { type LeaderboardCompany, type SignalConfig } from '../components/LeaderboardRow';
import LeaderboardSummaryCard from '../components/LeaderboardSummaryCard';
import { COPY } from '../theme/brand';

const SIGNAL: Record<string, SignalConfig> = {
  hot: { label: 'Hiring fast', color: 'var(--danger)', bg: 'var(--danger-soft)', dot: 'var(--danger)' },
  active: { label: 'Actively hiring', color: 'var(--accent)', bg: 'var(--accent-soft)', dot: 'var(--accent)' },
  steady: { label: 'Steady', color: 'var(--info)', bg: 'var(--info-soft)', dot: 'var(--info)' },
  stale: { label: 'Possibly stale', color: 'var(--ink-muted)', bg: 'var(--paper-2)', dot: 'var(--ink-faint)' },
};

const FILTER_OPTIONS = [
  { value: 'all', label: COPY.leaderboard.filterAll },
  { value: 'hot', label: 'Hot' },
  { value: 'active', label: 'Active' },
  { value: 'steady', label: 'Steady' },
  { value: 'stale', label: 'Stale' },
];

const SORT_OPTIONS = [
  { value: 'newThisWeek', label: COPY.leaderboard.sortNewThisWeek },
  { value: 'totalRoles', label: COPY.leaderboard.sortTotalRoles },
  { value: 'freshest', label: COPY.leaderboard.sortFreshest },
  { value: 'stale', label: COPY.leaderboard.sortMostStale },
];

interface ApiResponse {
  companies?: LeaderboardCompany[];
  totalNewThisWeek?: number;
  totalActiveRoles?: number;
  hiringFastCount?: number;
  staleCount?: number;
  updatedAt?: string;
}

export default function HiringLeaderboard() {
  const [sp, setSp] = useSearchParams();
  const filterSignal = sp.get('filter') || 'all';
  const sortKey = sp.get('sort') || 'newThisWeek';
  const showAll = sp.get('all') === '1';

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { document.title = COPY.leaderboard.documentTitle; }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    fetch('/api/jobs/hiring-leaderboard')
      .then(r => r.ok ? r.json() : null)
      .then((d: ApiResponse | null) => {
        if (cancelled) return;
        if (!d) { setError(COPY.leaderboard.errorBody); return; }
        setData(d);
      })
      .catch(() => { if (!cancelled) setError(COPY.leaderboard.errorBody); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!data?.companies) return [];
    let arr = [...data.companies];
    if (filterSignal !== 'all') arr = arr.filter(c => c.signal === filterSignal);
    arr.sort((a, b) => {
      if (sortKey === 'newThisWeek') return b.newThisWeek - a.newThisWeek;
      if (sortKey === 'totalRoles') return b.totalRoles - a.totalRoles;
      if (sortKey === 'freshest') return a.avgAgeDays - b.avgAgeDays;
      if (sortKey === 'stale') return b.stalePercent - a.stalePercent;
      return 0;
    });
    return arr;
  }, [data, filterSignal, sortKey]);

  const visible = showAll ? filtered : filtered.slice(0, 20);
  const maxNew = filtered.reduce((m, c) => Math.max(m, c.newThisWeek), 1);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: COPY.leaderboard.shareTitle, url });
      else { await navigator.clipboard.writeText(url); alert('Link copied!'); }
    } catch { /* user cancelled */ }
  };

  return (
    <Container size="xl" style={{ paddingTop: 'clamp(24px, 5vw, 40px)', paddingBottom: 60 }}>
      <PageHeader
        label={COPY.leaderboard.pageLabel}
        title={<>{COPY.leaderboard.pageTitle} <span style={{ color: 'var(--accent)' }}>{COPY.leaderboard.pageTitleAccent}</span></>}
        subtitle={data?.updatedAt ? `${COPY.leaderboard.subtitlePrefix} ${new Date(data.updatedAt).toLocaleDateString()} ${COPY.leaderboard.subtitleFrom} ${data.companies?.length || 0} ${COPY.leaderboard.subtitleSuffix}` : 'Tracking live hiring signals'}
        actions={
          <Button variant="ghost" size="sm" onClick={share}>
            <Share2 size={13} /> {COPY.leaderboard.shareButtonLabel}
          </Button>
        }
      />

      {/* Summary cards */}
      {data && !loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10, marginBottom: 24,
        }}>
          <LeaderboardSummaryCard
            icon={<TrendingUp size={16} />}
            label={COPY.leaderboard.summaryNewRoles}
            value={data.totalNewThisWeek ?? 0}
            accent="success"
          />
          <LeaderboardSummaryCard
            icon={<Briefcase size={16} />}
            label={COPY.leaderboard.summaryTotalRoles}
            value={(data.totalActiveRoles ?? 0).toLocaleString()}
            accent="info"
          />
          <LeaderboardSummaryCard
            icon={<Flame size={16} />}
            label={COPY.leaderboard.summaryHiringFast}
            value={data.hiringFastCount ?? 0}
            accent="warning"
          />
          <LeaderboardSummaryCard
            icon={<Clock size={16} />}
            label={COPY.leaderboard.summaryPossiblyStale}
            value={data.staleCount ?? 0}
            accent="neutral"
          />
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setSp(p => { const n = new URLSearchParams(p); n.set('filter', o.value); return n; })}
              style={{
                padding: '6px 12px', borderRadius: 999,
                fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 500,
                background: filterSignal === o.value ? 'var(--ink)' : 'transparent',
                color: filterSignal === o.value ? 'var(--paper)' : 'var(--ink-muted)',
                border: '1px solid',
                borderColor: filterSignal === o.value ? 'var(--ink)' : 'var(--border-strong)',
                cursor: 'pointer',
              }}
            >{o.label}</button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <select
          value={sortKey}
          onChange={e => setSp(p => { const n = new URLSearchParams(p); n.set('sort', e.target.value); return n; })}
          style={{
            padding: '7px 30px 7px 12px',
            fontFamily: 'inherit', fontSize: '0.82rem',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border-strong)',
            borderRadius: 9, cursor: 'pointer', outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236F6E69' stroke-width='2'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
          }}
        >
          {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 11 }} />)}
        </div>
      ) : error ? (
        <EmptyState icon={<Flame size={28} />} title={COPY.leaderboard.errorTitle} body={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Flame size={28} />}
          title={COPY.leaderboard.noMatchTitle}
          body={COPY.leaderboard.noMatchBody}
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map((c, i) => (
              <LeaderboardRow
                key={c.company}
                rank={i + 1}
                company={c}
                signalConfig={SIGNAL[c.signal] || SIGNAL.steady}
                maxNew={maxNew}
              />
            ))}
          </div>

          {filtered.length > 20 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button
                variant="ghost" size="md"
                onClick={() => setSp(p => {
                  const n = new URLSearchParams(p);
                  if (showAll) n.delete('all'); else n.set('all', '1');
                  return n;
                })}
              >
                {showAll
                  ? COPY.leaderboard.showTop20
                  : `${COPY.leaderboard.showAllPrefix} ${filtered.length} ${COPY.leaderboard.showAllSuffix}`}
              </Button>
            </div>
          )}

          {/* Methodology */}
          <div style={{
            marginTop: 40,
            padding: 18,
            background: 'var(--paper-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            fontSize: '0.82rem',
            color: 'var(--ink-muted)',
            lineHeight: 1.6,
          }}>
            <p style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              {COPY.leaderboard.methodologyTitle}
            </p>
            {COPY.leaderboard.methodologyBody}
          </div>
        </>
      )}
    </Container>
  );
}
