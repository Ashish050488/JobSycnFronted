// FILE: src/components/PipelineView.tsx
import { useMemo, useState } from 'react';
import { Search, X as XIcon, ChevronDown, Briefcase } from 'lucide-react';
import PipelineCard, { STAGES, STAGE_ORDER } from './PipelineCard';
import type { StageName } from './PipelineCard';
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

const STAGE_PRIORITY: Record<string, number> = {
  screening: 0, interview: 1, offer: 2, applied: 3,
  accepted: 4, rejected: 5, ghosted: 6,
};

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
    let hasActive = false; let latestActivity = 0;
    let bestPriority = 99; let bestStage: StageName = 'applied';
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

export default function PipelineView({ jobs, onStageChange }: PipelineViewProps) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return jobs.filter(j => {
      if (q && !j.company.toLowerCase().includes(q) && !j.jobTitle.toLowerCase().includes(q)) return false;
      if (stageFilter && (j.stage || 'applied') !== stageFilter) return false;
      return true;
    });
  }, [jobs, search, stageFilter]);

  const groups = useMemo(() => groupByCompany(filtered), [filtered]);

  if (jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>
        <Briefcase size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
        <p style={{ fontSize: '0.92rem' }}>No applications tracked yet.</p>
      </div>
    );
  }

  const toggle = (k: string) => setExpanded(prev => {
    const n = new Set(prev);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company or role…"
            style={{
              width: '100%', padding: '9px 12px 9px 34px',
              fontFamily: 'inherit', fontSize: '0.85rem',
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10, outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--ink-faint)', padding: 4,
            }}>
              <XIcon size={12} />
            </button>
          )}
        </div>
        <select
          value={stageFilter || ''}
          onChange={e => setStageFilter(e.target.value || null)}
          style={{
            padding: '9px 12px',
            fontFamily: 'inherit', fontSize: '0.85rem',
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">All stages</option>
          {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGES[s].label}</option>)}
        </select>
      </div>

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map(g => {
          const isOpen = expanded.has(g.company);
          return (
            <div
              key={g.company}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => toggle(g.company)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '12px 14px',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', color: 'var(--ink)',
                }}
              >
                <CompanyLogo name={g.company} size={32} borderRadius={9} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    letterSpacing: '-0.01em',
                  }}>{g.company}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: 1 }}>
                    {g.jobs.length} role{g.jobs.length === 1 ? '' : 's'} · best: {STAGES[g.bestStage].label}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  {STAGE_ORDER.filter(s => g.stageCounts[s] > 0).map(s => (
                    <span key={s} style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      padding: '2px 7px', borderRadius: 6,
                      background: STAGES[s].bg, color: STAGES[s].color,
                    }}>{g.stageCounts[s]}</span>
                  ))}
                </div>
                <ChevronDown size={16} style={{
                  color: 'var(--ink-faint)',
                  transition: 'transform 200ms ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }} />
              </button>
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {g.jobs.map(j => (
                    <PipelineCard key={j.jobId} {...j} onStageChange={onStageChange} />
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
