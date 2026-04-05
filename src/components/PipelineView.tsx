import { useEffect, useState, useMemo } from 'react';
import { Search, X, ChevronDown, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import PipelineCard, { STAGES, STAGE_ORDER } from './PipelineCard';
import type { StageName } from './PipelineCard';
import { Button } from './ui';
import CompanyLogo from './CompanyLogo';

export interface PipelineJob {
  jobId: string;
  jobTitle: string;
  company: string;
  location: string | null;
  department: string | null;
  applicationURL: string | null;
  stage: string;
  stageUpdatedAt: string;
  appliedAt: string;
  isListingActive: boolean;
}

interface PipelineViewProps {
  jobs: PipelineJob[];
  onStageChange: (jobId: string, newStage: string) => void;
}

interface CompanyGroup {
  company: string;
  jobs: PipelineJob[];
  stageCounts: Record<string, number>;
  hasActive: boolean;
  latestActivity: number;
  bestStage: StageName;
}

/* ─── helpers ──────────────────────────────────────────────── */



const STAGE_PRIORITY: Record<string, number> = {
  screening: 0, interview: 1, offer: 2, applied: 3,
  accepted: 4, rejected: 5, ghosted: 6,
};

/** Get accent color for company group based on best stage */
function getGroupAccentColor(group: CompanyGroup): string {
  const stages = Object.keys(group.stageCounts);
  if (stages.includes('offer') || stages.includes('accepted')) return 'var(--success)';
  if (stages.includes('interview')) return '#534AB7';
  if (stages.includes('screening')) return 'var(--info)';
  const allDead = stages.every(s => s === 'rejected' || s === 'ghosted');
  if (allDead) return 'var(--danger)';
  return 'var(--primary)';
}

function groupByCompany(jobs: PipelineJob[]): CompanyGroup[] {
  const map = new Map<string, PipelineJob[]>();
  for (const job of jobs) {
    const key = (job.company || 'Unknown').toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(job);
  }

  const groups: CompanyGroup[] = [];
  for (const [, groupJobs] of map) {
    const stageCounts: Record<string, number> = {};
    let hasActive = false;
    let latestActivity = 0;
    let bestPriority = 99;
    let bestStage: StageName = 'applied';

    for (const j of groupJobs) {
      const s = j.stage || 'applied';
      stageCounts[s] = (stageCounts[s] || 0) + 1;
      if (s === 'screening' || s === 'interview' || s === 'offer') hasActive = true;
      const t1 = new Date(j.stageUpdatedAt).getTime();
      const t2 = new Date(j.appliedAt).getTime();
      const t = Math.max(isNaN(t1) ? 0 : t1, isNaN(t2) ? 0 : t2);
      if (t > latestActivity) latestActivity = t;
      const p = STAGE_PRIORITY[s] ?? 9;
      if (p < bestPriority) { bestPriority = p; bestStage = s as StageName; }
    }

    groupJobs.sort((a, b) => {
      const pa = STAGE_PRIORITY[a.stage || 'applied'] ?? 9;
      const pb = STAGE_PRIORITY[b.stage || 'applied'] ?? 9;
      if (pa !== pb) return pa - pb;
      return new Date(b.stageUpdatedAt).getTime() - new Date(a.stageUpdatedAt).getTime();
    });

    groups.push({ company: groupJobs[0].company || 'Unknown', jobs: groupJobs, stageCounts, hasActive, latestActivity, bestStage });
  }

  groups.sort((a, b) => {
    const aAllDead = a.jobs.every(j => j.stage === 'ghosted' || j.stage === 'rejected');
    const bAllDead = b.jobs.every(j => j.stage === 'ghosted' || j.stage === 'rejected');
    if (aAllDead !== bAllDead) return aAllDead ? 1 : -1;
    if (a.hasActive !== b.hasActive) return a.hasActive ? -1 : 1;
    return b.latestActivity - a.latestActivity;
  });

  return groups;
}

/* ─── component ────────────────────────────────────────────── */

export default function PipelineView({ jobs, onStageChange }: PipelineViewProps) {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const job of jobs) {
      const s = job.stage || 'applied';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(j => (j.company || '').toLowerCase().includes(q));
    }
    if (stageFilter) {
      result = result.filter(j => (j.stage || 'applied') === stageFilter);
    }
    return result;
  }, [jobs, search, stageFilter]);

  const groups = useMemo(() => groupByCompany(filteredJobs), [filteredJobs]);

  const toggleCompany = (company: string) => {
    const key = company.toLowerCase();
    setExpandedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

 

  // Empty state
  if (jobs.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 24px',
        border: '1.25px dashed var(--border)', borderRadius: 14,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <Briefcase size={40} style={{ color: 'var(--subtle-ink)', opacity: 0.6 }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>
          No applications tracked yet
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--muted-ink)', maxWidth: 360, lineHeight: 1.5 }}>
          Start applying from the job feed — every application you track here helps you stay organized.
        </div>
        <Link to="/jobs" style={{ textDecoration: 'none', marginTop: 8 }}>
          <Button variant="primary" size="sm">Browse Jobs →</Button>
        </Link>
      </div>
    );
  }

  // Filtered empty
  const emptyMessage = (() => {
    if (groups.length > 0) return null;
    if (search.trim() && stageFilter) return 'No applications match your filters.';
    if (search.trim()) return 'No applications match your search.';
    if (stageFilter) return 'No applications in this stage.';
    return null;
  })();

  return (
    <div>
      {/* ── Search bar ────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <Search size={16} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: searchFocused ? 'var(--primary)' : 'var(--muted-ink)',
          transition: 'color 0.18s', pointerEvents: 'none',
        }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Got a response? Search by company name..."
          style={{
            width: '100%', height: 44, borderRadius: 12,
            border: `1.25px solid ${searchFocused ? 'var(--primary)' : 'var(--border)'}`,
            background: 'var(--surface-solid)', color: 'var(--ink)',
            paddingLeft: 38, paddingRight: search ? 36 : 14,
            fontSize: '0.88rem', fontFamily: 'inherit',
            outline: 'none', transition: 'border-color 0.18s',
            boxSizing: 'border-box',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'var(--paper2)', border: 'none', borderRadius: 999,
              width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--muted-ink)',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Showing X of Y */}
      <div style={{ fontSize: '0.76rem', color: 'var(--subtle-ink)', marginBottom: 14 }}>
        Showing {filteredJobs.length} of {jobs.length} application{jobs.length !== 1 ? 's' : ''}
      </div>

      {/* ── Stage filter pills ────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        paddingBottom: 4, scrollbarWidth: 'none',
      }}>
        <button
          onClick={() => setStageFilter(null)}
          style={{
            padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: !stageFilter ? 700 : 500,
            fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
            border: !stageFilter ? '1.5px solid var(--primary)' : '1.25px solid var(--border)',
            background: !stageFilter ? 'var(--primary)' : 'var(--surface-solid)',
            color: !stageFilter ? '#fff' : 'var(--muted-ink)',
            transition: 'all 0.18s',
          }}
        >
          All ({jobs.length})
        </button>
        {STAGE_ORDER.map(s => {
          const count = stageCounts[s] || 0;
          if (count === 0) return null;
          const cfg = STAGES[s];
          const active = stageFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStageFilter(prev => prev === s ? null : s)}
              style={{
                padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: active ? 700 : 500,
                fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0,
                border: active ? `1.5px solid ${cfg.color}` : '1.25px solid var(--border)',
                background: active ? cfg.bg : 'var(--surface-solid)',
                color: active ? cfg.color : 'var(--muted-ink)',
                transition: 'all 0.18s',
              }}
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Empty filtered state ──────────────────────── */}
      {emptyMessage && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          background: 'var(--surface-solid)', border: '1.25px dashed var(--border)',
          borderRadius: 14, color: 'var(--muted-ink)', fontSize: '0.9rem',
        }}>
          {emptyMessage}
        </div>
      )}

      {/* ── Company groups ────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map(group => {
          const key = group.company.toLowerCase();
          const isExpanded = expandedCompanies.has(key);
          const firstUrl = group.jobs[0]?.applicationURL ?? null;
          const accentColor = getGroupAccentColor(group);

          return (
            <div key={key} style={{
              borderLeft: `3px solid ${accentColor}`,
              border: `1.25px solid var(--border)`,
              borderLeftWidth: 3,
              borderLeftColor: accentColor,
              borderRadius: '0 14px 14px 0',
              overflow: 'hidden',
              background: 'var(--surface-solid)',
            }}>
              {/* Company header */}
              <button
                onClick={() => toggleCompany(group.company)}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper2)')}
                onMouseLeave={e => (e.currentTarget.style.background = isExpanded ? 'var(--primary-soft)' : 'transparent')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 10, padding: '14px 18px',
                  background: isExpanded ? 'var(--primary-soft)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.18s', textAlign: 'left', flexWrap: isMobile ? 'wrap' : 'nowrap',
                }}
              >
                {/* Company logo */}
                <CompanyLogo name={group.company} url={firstUrl} size={32} borderRadius={8} style={{ flexShrink: 0 }} />

                {/* Company name */}
                <span style={{
                  fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: isMobile ? '1 1 calc(100% - 44px)' : '0 1 auto',
                }}>
                  {group.company}
                </span>

                {/* Stage summary dots */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, order: isMobile ? 3 : 0, width: isMobile ? '100%' : 'auto', marginLeft: isMobile ? 42 : 0, flexWrap: 'wrap' }}>
                  {STAGE_ORDER.map(s => {
                    const count = group.stageCounts[s];
                    if (!count) return null;
                    const cfg = STAGES[s];
                    return (
                      <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: cfg.color, display: 'inline-block', flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: 600 }}>
                          {count}
                        </span>
                      </span>
                    );
                  })}
                </div>

                <span style={{ flex: 1, minWidth: isMobile ? 0 : undefined }} />

                <span style={{
                  fontSize: '0.75rem', color: 'var(--muted-ink)',
                  background: 'var(--paper2)', padding: '2px 10px',
                  borderRadius: 999, flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {group.jobs.length} application{group.jobs.length !== 1 ? 's' : ''}
                </span>
                {/* Closed listings count */}
                {(() => {
                  const closedCount = group.jobs.filter(j => !j.isListingActive).length;
                  return closedCount > 0 ? (
                    <span style={{
                      fontSize: '0.72rem', color: 'var(--danger)',
                      opacity: 0.7, whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      {closedCount} closed
                    </span>
                  ) : null;
                })()}

                <ChevronDown size={16} style={{
                  color: 'var(--muted-ink)', flexShrink: 0,
                  transition: 'transform 0.22s',
                  transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                }} />
              </button>

              {/* Expanded body */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid var(--border)',
                  padding: '8px 12px 12px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {group.jobs.map(job => (
                    <PipelineCard
                      key={job.jobId}
                      jobId={job.jobId}
                      jobTitle={job.jobTitle}
                      company={job.company}
                      location={job.location}
                      department={job.department}
                      applicationURL={job.applicationURL}
                      stage={job.stage}
                      stageUpdatedAt={job.stageUpdatedAt}
                      appliedAt={job.appliedAt}
                      isListingActive={job.isListingActive}
                      onStageChange={onStageChange}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
