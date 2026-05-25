// FILE: src/pages/HiringLeaderboard.tsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Minus, Flame, Clock, AlertTriangle,
  Share2, ChevronDown, ChevronUp, Building2, Crown, Medal, Trophy,
} from 'lucide-react';
import { Container, Spinner, EmptyState } from '../components/ui';
import { LeaderboardSummaryCard } from '../components/LeaderboardSummaryCard';
import { LeaderboardRow } from '../components/LeaderboardRow';
import { COPY } from '../theme/brand';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LeaderboardCompany {
  rank: number; company: string; totalActiveRoles: number;
  newThisWeek: number; newLastWeek: number; delta: number;
  trend: 'up' | 'down' | 'stable';
  hiringSignal: 'hot' | 'active' | 'steady' | 'stale';
  staleRoles: number; staleRatio: number; avgAgeDays: number;
  cities: string[]; topRoles: string[]; mostRecentJobDate: string | null;
}

interface LeaderboardSummary {
  totalCompanies: number; totalActiveJobs: number;
  totalNewThisWeek: number; totalNewLastWeek: number;
  weekOverWeekDelta: number; hotCompanies: number; staleCompanies: number;
}

interface LeaderboardData {
  companies: LeaderboardCompany[];
  summary: LeaderboardSummary;
  updatedAt: string;
}

type SortKey = 'newThisWeek' | 'totalActiveRoles' | 'avgAgeDays' | 'staleRatio';
type FilterSignal = 'all' | 'hot' | 'active' | 'steady' | 'stale';

const L = COPY.leaderboard;

const SIGNAL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  hot:    { label: 'Hiring Fast',    icon: <Flame size={13} />,         color: 'var(--danger)',   bg: 'var(--danger-soft)',  border: 'var(--danger)' },
  active: { label: 'Active',         icon: <TrendingUp size={13} />,    color: 'var(--success)',  bg: 'var(--success-soft)', border: 'var(--success)' },
  steady: { label: 'Steady',         icon: <Minus size={13} />,         color: 'var(--muted-ink)', bg: 'var(--paper2)',     border: 'var(--border)' },
  stale:  { label: 'Possibly Stale', icon: <AlertTriangle size={13} />, color: 'var(--warning)',  bg: 'var(--warning-soft)', border: 'var(--warning)' },
};

const ROW_LABELS = {
  colNew: L.colNew, colTotal: L.colTotal, colAge: L.colAge, colStale: L.colStale,
  expandedWoW: L.expandedWoW, expandedViewRoles: L.expandedViewRoles,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Unknown';
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

// ─── Podium Card ──────────────────────────────────────────────────────────────
function PodiumCard({ company: c, position, isMobile }: {
  company: LeaderboardCompany; position: 1 | 2 | 3; isMobile: boolean;
}) {
  const signal = SIGNAL_CONFIG[c.hiringSignal];
  const gradients: Record<number, string> = {
    1: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
    2: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)',
    3: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)',
  };
  const glows: Record<number, string> = {
    1: '0 0 20px rgba(251,191,36,0.25), 0 4px 16px rgba(0,0,0,0.12)',
    2: '0 0 16px rgba(148,163,184,0.15), 0 4px 12px rgba(0,0,0,0.08)',
    3: '0 0 16px rgba(217,119,6,0.15), 0 4px 12px rgba(0,0,0,0.08)',
  };
  const icons: Record<number, React.ReactNode> = {
    1: <Crown size={18} />,
    2: <Medal size={16} />,
    3: <Trophy size={16} />,
  };

  return (
    <Link
      to={`/jobs?company=${encodeURIComponent(c.company)}`}
      style={{
        textDecoration: 'none', color: 'inherit',
        flex: position === 1 ? '1.3' : '1',
        display: 'flex', flexDirection: 'column',
        borderRadius: 16,
        border: '1.25px solid var(--border)',
        overflow: 'hidden',
        background: 'var(--surface-solid)',
        boxShadow: glows[position],
        transition: 'transform 0.2s, box-shadow 0.2s',
        order: position === 1 ? 0 : position === 2 ? -1 : 1,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
    >
      {/* Medal strip */}
      <div style={{
        height: 4,
        background: gradients[position],
      }} />

      <div style={{ padding: isMobile ? '12px' : '16px 18px', flex: 1 }}>
        {/* Rank + medal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 30, height: 30, borderRadius: 10,
            background: gradients[position],
            color: '#fff', fontWeight: 800, fontSize: '0.85rem',
          }}>
            {position}
          </span>
          <span style={{ color: position === 1 ? '#f59e0b' : position === 2 ? '#94a3b8' : '#b45309' }}>
            {icons[position]}
          </span>
        </div>

        {/* Company name */}
        <div style={{
          fontWeight: 800,
          fontSize: isMobile ? '0.9rem' : position === 1 ? '1.05rem' : '0.92rem',
          color: 'var(--ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>
          {c.company}
        </div>

        {/* Signal + cities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: signal.color,
            boxShadow: c.hiringSignal === 'hot' ? `0 0 6px ${signal.color}` : 'none',
          }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: signal.color, textTransform: 'uppercase' }}>
            {signal.label}
          </span>
          {c.cities.length > 0 && (
            <span style={{ fontSize: '0.62rem', color: 'var(--subtle-ink)' }}>
              · {c.cities[0]}
            </span>
          )}
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: isMobile ? 10 : 14,
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
        }}>
          <div>
            <div className="font-sketch-num" style={{
              fontSize: position === 1 ? '1.4rem' : '1.2rem',
              fontWeight: 800,
              color: 'var(--primary)',
              lineHeight: 1,
            }}>
              +{c.newThisWeek}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--subtle-ink)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {L.colNew}
            </div>
          </div>
          <div>
            <div style={{ fontSize: position === 1 ? '1.1rem' : '0.95rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
              {c.totalActiveRoles}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--subtle-ink)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {L.colTotal}
            </div>
          </div>
          {c.delta !== 0 && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontSize: '0.78rem', fontWeight: 700,
                color: c.delta > 0 ? 'var(--success)' : 'var(--danger)',
              }}>
                {c.delta > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {c.delta > 0 ? '+' : ''}{c.delta}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HiringLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('newThisWeek');
  const [filterSignal, setFilterSignal] = useState<FilterSignal>('all');
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [vw, setVw] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);

  useEffect(() => { document.title = L.documentTitle; }, []);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    setLoading(true); setError(null);
    fetch('/api/jobs/hiring-leaderboard')
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const isMobile = vw < 640;
  const isTablet = vw < 1024;

  const processed = useMemo(() => {
    if (!data?.companies) return [];
    let list = [...data.companies];
    if (filterSignal !== 'all') list = list.filter(c => c.hiringSignal === filterSignal);
    list.sort((a, b) => {
      if (sortKey === 'avgAgeDays') return a[sortKey] - b[sortKey];
      if (sortKey === 'staleRatio') return b[sortKey] - a[sortKey];
      return b[sortKey] - a[sortKey];
    });
    return list.map((c, i) => ({ ...c, rank: i + 1 }));
  }, [data, sortKey, filterSignal]);

  const visible = showAll ? processed : processed.slice(0, 20);
  const top3 = processed.slice(0, 3);
  const rest = visible.slice(3);
  const maxRoles = processed.length > 0 ? Math.max(...processed.map(c => c.totalActiveRoles), 1) : 1;

  const handleShare = async () => {
    if (!data?.summary) return;
    const text = `${L.pageTitle} ${L.pageTitleAccent}?\n\n${data.summary.totalNewThisWeek} new tech roles this week across ${data.summary.totalCompanies} companies.\n\nCheck the live leaderboard:`;
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: L.shareTitle, text, url }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(`${text}\n${url}`); alert('Link copied!'); } catch { /* fail */ }
    }
  };

  if (loading) {
    return (
      <Container size="xl" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, flexDirection: 'column', gap: 16 }}>
          <Spinner size={28} />
          <p style={{ color: 'var(--muted-ink)', fontSize: '0.88rem' }}>{L.loadingText}</p>
        </div>
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container size="xl" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <EmptyState title={L.errorTitle} body={error || L.errorBody} icon={<AlertTriangle size={32} />} />
      </Container>
    );
  }

  const { summary, updatedAt } = data;

  return (
    <Container size="xl" style={{ paddingTop: isMobile ? 8 : 12, paddingBottom: 60 }}>
      {/* ── Header — compact with inline stats ─────────────────────────── */}
      <div style={{ marginBottom: isMobile ? 16 : 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p className="font-sketch" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 2 }}>
              {L.pageLabel}
            </p>
            <h1 style={{ fontSize: 'clamp(1.2rem,2.5vw,1.7rem)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {L.pageTitle} <span style={{ color: 'var(--primary)' }}>{L.pageTitleAccent}</span>
            </h1>
            <p style={{ color: 'var(--subtle-ink)', fontSize: '0.75rem', marginTop: 4 }}>
              {L.subtitlePrefix} {formatDate(updatedAt)} {L.subtitleFrom} {summary.totalCompanies} {L.subtitleSuffix}
            </p>
          </div>
          <button
            onClick={handleShare}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10,
              border: '1.25px solid var(--border)',
              background: 'var(--surface-solid)', color: 'var(--muted-ink)',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.78rem',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted-ink)'; }}
          >
            <Share2 size={13} /> {L.shareButtonLabel}
          </button>
        </div>

        {/* Stat strip — compact horizontal bar */}
        <div style={{
          display: 'flex',
          marginTop: 14,
          borderRadius: 12,
          border: '1.25px solid var(--border)',
          background: 'var(--surface-solid)',
          overflow: 'hidden',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}>
          <LeaderboardSummaryCard value={summary.totalNewThisWeek} label={L.summaryNewRoles} delta={summary.weekOverWeekDelta} accent />
          <LeaderboardSummaryCard value={summary.totalActiveJobs} label={L.summaryTotalRoles} />
          <LeaderboardSummaryCard value={summary.hotCompanies} label={L.summaryHiringFast} icon={<Flame size={14} color="var(--danger)" />} />
          <LeaderboardSummaryCard value={summary.staleCompanies} label={L.summaryPossiblyStale} icon={<Clock size={14} color="var(--warning)" />} />
        </div>
      </div>

      {/* ── Podium — top 3 cards ────────────────────────────────────────── */}
      {top3.length >= 3 && filterSignal === 'all' && sortKey === 'newThisWeek' && (
        <div style={{
          display: 'flex',
          gap: isMobile ? 8 : 12,
          marginBottom: isMobile ? 16 : 20,
          alignItems: 'stretch',
        }}>
          {[top3[0], top3[1], top3[2]].map((c, i) => (
            <PodiumCard
              key={c.company}
              company={c}
              position={(i === 0 ? 1 : i === 1 ? 2 : 3) as 1 | 2 | 3}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}

      {/* ── Filter + Sort — sticky compact bar ─────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        marginBottom: 0, alignItems: 'center',
        padding: isMobile ? '8px 10px' : '8px 14px',
        background: 'color-mix(in srgb, var(--surface-solid) 90%, transparent)',
        backdropFilter: 'blur(12px)',
        borderRadius: '12px 12px 0 0',
        border: '1.25px solid var(--border)',
        borderBottom: 'none',
        position: 'sticky', top: 60, zIndex: 40,
      }}>
        {(['all', 'hot', 'active', 'steady', 'stale'] as FilterSignal[]).map(sig => {
          const isActive = filterSignal === sig;
          const conf = sig === 'all' ? null : SIGNAL_CONFIG[sig];
          return (
            <button
              key={sig}
              onClick={() => { setFilterSignal(sig); setShowAll(false); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 8,
                fontSize: '0.73rem', fontWeight: 600, fontFamily: 'inherit',
                cursor: 'pointer', transition: 'all 0.15s',
                border: isActive ? `1.25px solid ${conf?.border || 'var(--primary)'}` : '1.25px solid transparent',
                background: isActive ? (conf?.bg || 'var(--primary-soft)') : 'transparent',
                color: isActive ? (conf?.color || 'var(--primary)') : 'var(--muted-ink)',
              }}
            >
              {conf?.icon}
              {sig === 'all' ? L.filterAll : conf?.label}
            </button>
          );
        })}
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          style={{
            marginLeft: 'auto',
            padding: '5px 24px 5px 8px', borderRadius: 8,
            border: '1.25px solid var(--border)',
            background: 'var(--surface-solid)', color: 'var(--ink)',
            fontSize: '0.73rem', fontWeight: 600, fontFamily: 'inherit',
            cursor: 'pointer', appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236F6F6F' stroke-width='2'%3E%3Cpath d='M3 4.5l3 3 3-3'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center',
          }}
        >
          <option value="newThisWeek">{L.sortNewThisWeek}</option>
          <option value="totalActiveRoles">{L.sortTotalRoles}</option>
          <option value="avgAgeDays">{L.sortFreshest}</option>
          <option value="staleRatio">{L.sortMostStale}</option>
        </select>
      </div>

      {/* ── Table header ───────────────────────────────────────────────── */}
      {!isMobile && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isTablet
            ? '32px 1fr 52px 46px 20px'
            : '36px 1fr 56px 50px 70px 54px 20px',
          gap: isTablet ? 8 : 12,
          padding: '6px 16px',
          borderLeft: '1.25px solid var(--border)',
          borderRight: '1.25px solid var(--border)',
          background: 'var(--paper2)',
          fontSize: '0.6rem', fontWeight: 700,
          color: 'var(--subtle-ink)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          <span style={{ textAlign: 'center' }}>#</span>
          <span>Company</span>
          <span style={{ textAlign: 'right' }}>{L.colNew}</span>
          <span style={{ textAlign: 'right' }}>{L.colTotal}</span>
          {!isTablet && <span style={{ textAlign: 'right' }}>{L.colAge}</span>}
          {!isTablet && <span style={{ textAlign: 'right' }}>{L.colStale}</span>}
          <span />
        </div>
      )}

      {/* ── Company list ───────────────────────────────────────────────── */}
      <div style={{
        border: '1.25px solid var(--border)',
        borderTop: isMobile ? '1.25px solid var(--border)' : 'none',
        borderRadius: isMobile ? '0 0 12px 12px' : '0 0 12px 12px',
        overflow: 'hidden',
        background: 'var(--surface-solid)',
      }}>
        {visible.length === 0 ? (
          <EmptyState title={L.noMatchTitle} body={L.noMatchBody} icon={<Building2 size={28} />} />
        ) : (
          (filterSignal === 'all' && sortKey === 'newThisWeek' ? rest : visible).map(company => (
            <LeaderboardRow
              key={company.company}
              company={company}
              isMobile={isMobile}
              isTablet={isTablet}
              expanded={expandedCompany === company.company}
              onToggle={() => setExpandedCompany(expandedCompany === company.company ? null : company.company)}
              signalConfig={SIGNAL_CONFIG}
              labels={ROW_LABELS}
              maxRoles={maxRoles}
            />
          ))
        )}
      </div>

      {/* ── Show more ──────────────────────────────────────────────────── */}
      {processed.length > 20 && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => setShowAll(!showAll)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 20px', borderRadius: 10,
              border: '1.25px solid var(--border)',
              background: 'var(--surface-solid)',
              color: 'var(--muted-ink)', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 600, fontSize: '0.78rem',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted-ink)'; }}
          >
            {showAll ? L.showTop20 : `${L.showAllPrefix} ${processed.length} ${L.showAllSuffix}`}
            {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      )}

      {/* ── Methodology ────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 24,
        padding: isMobile ? '12px' : '14px 18px',
        borderRadius: 10,
        border: '1px dashed var(--border)',
        fontSize: '0.72rem', color: 'var(--subtle-ink)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--muted-ink)' }}>{L.methodologyTitle}</strong> {L.methodologyBody}
      </div>
    </Container>
  );
}