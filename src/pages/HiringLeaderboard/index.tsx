// FILE: src/pages/HiringLeaderboard/index.tsx
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Flame, Share2 } from 'lucide-react';
import { Container, PageHeader, Button, EmptyState } from '../../components/ui';
import LeaderboardRow, { type LeaderboardCompany } from '../../components/LeaderboardRow';
import { COPY } from '../../theme/brand';
import { SIGNAL } from './constants';
import SummaryCards from './SummaryCards';
import FilterSortBar from './FilterSortBar';
import Methodology from './Methodology';

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

  useEffect(() => { document.title = `${COPY.leaderboard.pageTitle} · JobMesh`; }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/jobs/hiring-leaderboard')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: ApiResponse) => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
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
      if (sortKey === 'freshest') {
        if (a.avgAgeDays === null && b.avgAgeDays === null) return 0;
        if (a.avgAgeDays === null) return 1;
        if (b.avgAgeDays === null) return -1;
        return a.avgAgeDays - b.avgAgeDays;
      }
      if (sortKey === 'stale') return b.stalePercent - a.stalePercent;
      return 0;
    });
    return arr;
  }, [data, filterSignal, sortKey]);

  const visible = showAll ? filtered : filtered.slice(0, 20);
  const maxNew = filtered.reduce((m, c) => Math.max(m, c.newThisWeek), 1);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: COPY.leaderboard.pageTitle, url }); return; } catch { /* user cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  };

  return (
    <Container size="xl" style={{ paddingTop: 'clamp(16px, 4vw, 24px)', paddingBottom: 60 }}>
      <PageHeader
        label={COPY.leaderboard.pageLabel}
        title={<>{COPY.leaderboard.pageTitle} <span style={{ color: 'var(--accent)' }}>{COPY.leaderboard.pageTitleAccent}</span></>}
        subtitle={data?.updatedAt ? `${COPY.leaderboard.subtitlePrefix} ${new Date(data.updatedAt).toLocaleDateString()} ${COPY.leaderboard.subtitleFrom} ${data.companies?.length || 0} ${COPY.leaderboard.subtitleSuffix}` : 'Tracking live hiring signals'}
        actions={<Button variant="ghost" size="sm" onClick={share}><Share2 size={13} /> {COPY.leaderboard.shareButtonLabel}</Button>}
      />

      {data && !loading && (
        <SummaryCards
          totalNewThisWeek={data.totalNewThisWeek ?? 0}
          totalActiveRoles={data.totalActiveRoles ?? 0}
          hiringFastCount={data.hiringFastCount ?? 0}
          staleCount={data.staleCount ?? 0}
        />
      )}

      <FilterSortBar filterSignal={filterSignal} sortKey={sortKey} setSp={setSp} />

      {loading ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 11 }} />)}
        </div>
      ) : error ? (
        <EmptyState icon={<Flame size={28} />} title={COPY.leaderboard.errorTitle} body={error} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Flame size={28} />} title={COPY.leaderboard.noMatchTitle} body={COPY.leaderboard.noMatchBody} />
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
                {showAll ? COPY.leaderboard.showTop20 : `${COPY.leaderboard.showAllPrefix} ${filtered.length} ${COPY.leaderboard.showAllSuffix}`}
              </Button>
            </div>
          )}

          <Methodology companies={filtered} />
        </>
      )}
    </Container>
  );
}
