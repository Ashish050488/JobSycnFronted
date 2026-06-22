// FILE: src/pages/Trends/index.tsx
// The Trends page — a market-signal dashboard built from custom SVG charts:
// posting momentum, role demand, experience/workplace splits, and top movers.

import { useEffect, useState } from 'react';
import { Share2, BarChart3 } from 'lucide-react';
import { Container, PageHeader, Button, EmptyState } from '../../components/ui';
import { COPY } from '../../theme/brand';
import type { TrendsData } from './types';
import { ChartCard } from './shared';
import StatRibbon from './StatRibbon';
import MomentumChart from './MomentumChart';
import CategoryDemand from './CategoryDemand';
import SplitDonuts from './SplitDonuts';
import Movers from './Movers';

function relUpdated(iso?: string): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Trends() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { document.title = COPY.trends.documentTitle; }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/jobs/trends')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d: TrendsData) => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: COPY.trends.shareTitle, url }); return; } catch { /* cancelled */ } }
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  };

  const hasData = !!data && data.daily.length > 0;

  return (
    <Container size="xl" style={{ paddingTop: 'clamp(16px, 4vw, 24px)', paddingBottom: 60 }}>
      <PageHeader
        label={COPY.trends.pageLabel}
        title={<>{COPY.trends.pageTitle} <span style={{ color: 'var(--accent)' }}>{COPY.trends.pageTitleAccent}</span></>}
        subtitle={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            <span>{COPY.trends.subtitle}</span>
            {data?.updatedAt && <span style={{ color: 'var(--ink-faint)' }}>· {COPY.trends.updatedPrefix} {relUpdated(data.updatedAt)}</span>}
          </span>
        }
        actions={<Button variant="ghost" size="sm" onClick={share}><Share2 size={13} /> {COPY.trends.shareButtonLabel}</Button>}
      />

      {error ? (
        <EmptyState icon={<BarChart3 size={28} />} title={COPY.trends.errorTitle} body={error} />
      ) : loading ? (
        <LoadingSkeleton />
      ) : !hasData ? (
        <EmptyState icon={<BarChart3 size={28} />} title={COPY.trends.emptyTitle} body={COPY.trends.emptyBody} />
      ) : (
        <>
          <StatRibbon summary={data.summary} />

          <ChartCard title={COPY.trends.momentumTitle} subtitle={COPY.trends.momentumSub} style={{ marginBottom: 14 }}>
            <MomentumChart data={data.daily} />
          </ChartCard>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14, marginBottom: 14 }}>
            <ChartCard title={COPY.trends.categoriesTitle} subtitle={COPY.trends.categoriesSub}>
              {data.categories.length > 0
                ? <CategoryDemand categories={data.categories} />
                : <Muted>No category data yet.</Muted>}
            </ChartCard>

            <ChartCard title={`${COPY.trends.splitExperienceTitle} · ${COPY.trends.splitWorkplaceTitle}`}>
              <SplitDonuts
                experience={data.experience}
                workplace={data.workplace}
                experienceTitle={COPY.trends.splitExperienceTitle}
                workplaceTitle={COPY.trends.splitWorkplaceTitle}
              />
            </ChartCard>
          </div>

          <ChartCard title={COPY.trends.moversTitle}>
            <Movers gaining={data.movers.gaining} cooling={data.movers.cooling} />
          </ChartCard>
        </>
      )}
    </Container>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)' }}>{children}</p>;
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 92, borderRadius: 14 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 320, borderRadius: 14 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <div className="skeleton" style={{ height: 280, borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 280, borderRadius: 14 }} />
      </div>
    </div>
  );
}
