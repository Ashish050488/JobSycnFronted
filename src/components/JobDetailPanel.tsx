// FILE: src/components/JobDetailPanel.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Building2, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Badge, Button } from './ui';
import CompanyLogo from './CompanyLogo';
import { COPY } from '../theme/brand';
import type { IJob, IJobAutoTags } from '../types';
import CompanyIntel from './CompanyIntel';
import SimilarJobs from './SimilarJobs';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function stripHtmlText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function buildSkillsRegex(skills: string[]): RegExp | null {
  if (!skills.length) return null;
  const sorted = [...skills].sort((a, b) => b.length - a.length);
  const patterns = sorted.map(skill => {
    const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const start = /\w/.test(skill[0]) ? '\\b' : '';
    const end = /\w/.test(skill[skill.length - 1]) ? '\\b' : '';
    return `${start}${esc}${end}`;
  });
  return new RegExp(patterns.join('|'), 'gi');
}

const DEFAULT_AUTO_TAGS: IJobAutoTags = {
  techStack: [],
  roleCategory: 'Other',
  experienceBand: null,
  isEntryLevel: false,
  domain: [],
  urgency: null,
  education: null,
};

export function getAutoTags(job: IJob): IJobAutoTags {
  return {
    ...DEFAULT_AUTO_TAGS,
    ...(job.autoTags ?? {}),
    techStack: Array.isArray(job.autoTags?.techStack) ? job.autoTags!.techStack : [],
    domain: Array.isArray(job.autoTags?.domain) ? job.autoTags!.domain : [],
    isEntryLevel: job.autoTags?.isEntryLevel ?? job.isEntryLevel ?? false,
  };
}

export function roleBadgeStyle(roleCategory: string | null) {
  switch (roleCategory) {
    case 'Frontend': return { bg: '#dbeafe', color: '#1e40af' };
    case 'Backend': return { bg: '#ede9fe', color: '#5b21b6' };
    case 'Full Stack': return { bg: '#e0e7ff', color: '#3730a3' };
    case 'DevOps/SRE': return { bg: '#ffedd5', color: '#9a3412' };
    case 'Data': return { bg: '#ccfbf1', color: '#115e59' };
    case 'ML/AI': return { bg: '#fce7f3', color: '#9d174d' };
    case 'QA': return { bg: '#f3f4f6', color: '#374151' };
    case 'Mobile': return { bg: '#dcfce7', color: '#166534' };
    default: return { bg: 'var(--paper2)', color: 'var(--muted-ink)' };
  }
}

export function inferWorkplace(job: IJob): 'remote' | 'hybrid' | 'on-site' | null {
  const text = `${job.WorkplaceType || ''} ${job.Location || ''} ${job.JobTitle || ''}`.toLowerCase();
  if (text.includes('remote')) return 'remote';
  if (text.includes('hybrid')) return 'hybrid';
  if (text.includes('on-site') || text.includes('onsite') || text.includes('on site')) return 'on-site';
  return null;
}

export function relTime(d: string | null) {
  if (!d) return null;
  const posted = new Date(d);
  if (isNaN(posted.getTime())) return null;
  const diff = Math.floor((Date.now() - posted.getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

function workplaceBadge(job: IJob): { label: string; bg: string; color: string } | null {
  const wp = inferWorkplace(job);
  if (wp === 'remote') return { label: 'Remote', bg: '#d1fae5', color: '#065f46' };
  if (wp === 'hybrid') return { label: 'Hybrid', bg: '#fef3c7', color: '#92400e' };
  if (wp === 'on-site') return { label: 'On-site', bg: '#dbeafe', color: '#1e40af' };
  return null;
}

function salaryDisplay(job: IJob): string | null {
  if (job.SalaryInfo) return job.SalaryInfo;
  if (job.SalaryMin && job.SalaryMax) {
    const fmt = (n: number) =>
      (job.SalaryCurrency === 'INR' || !job.SalaryCurrency) && n >= 100000
        ? `${(n / 100000).toFixed(1)}L`
        : `${(n / 1000).toFixed(0)}K`;
    const curr =
      job.SalaryCurrency === 'INR' ? 'Rs ' :
        job.SalaryCurrency === 'USD' ? '$' :
          (job.SalaryCurrency ? job.SalaryCurrency + ' ' : '');
    return `${curr}${fmt(job.SalaryMin)} - ${curr}${fmt(job.SalaryMax)}`;
  }
  return null;
}

const platformLabel: Record<string, string> = {
  lever: 'Lever',
  greenhouse: 'Greenhouse',
  ashby: 'Ashby',
};

// CompanyLogo component (uses domain + Clearbit + fallback) is used below

// ─── Props ───────────────────────────────────────────────────────────────────

export interface JobDetailPanelProps {
  job: IJob;
  domain?: string;
  mobileMode?: boolean;
  is3xl: boolean;
  appliedJobIds: Set<string>;
  comeBackMap: Map<string, { note: string; addedAt: string }>;
  onToggleApplied: (jobId: string) => Promise<void>;
  onToggleComeBack: (jobId: string, note: string) => void;
  onRemoveComeBack: (jobId: string) => void;
  onSelectJob?: (jobId: string) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JobDetailPanel({
  job,
  domain,
  mobileMode = false,
  is3xl,
  appliedJobIds,
  comeBackMap,
  onToggleApplied,
  onToggleComeBack,
  onRemoveComeBack,
  onSelectJob,
}: JobDetailPanelProps) {
  const descRef = useRef<HTMLDivElement>(null);
  const { userSkills: skills, currentUser } = useUser();
  const [cbExpanded, setCbExpanded] = useState(false);
  const [cbNote, setCbNote] = useState('');

  const matchResult = useMemo(() => {
    if (!skills.length) return null;
    const text = stripHtmlText(job.DescriptionCleaned || job.Description || '');
    const matched: string[] = [];
    const unmatched: string[] = [];
    for (const skill of skills) {
      const re = buildSkillsRegex([skill]);
      if (re && re.test(text)) matched.push(skill);
      else unmatched.push(skill);
    }
    return { matched, unmatched, total: skills.length };
  }, [job, skills]);

  const colorInfo = matchResult ? (
    matchResult.matched.length === 0 ? { color: 'var(--muted-ink)', label: '' } :
      matchResult.matched.length <= 2 ? { color: '#92400e', label: '' } :
        matchResult.matched.length <= 4 ? { color: '#166534', label: '' } :
          { color: '#14532d', label: 'Strong match' }
  ) : null;

  // Hide boilerplate sections and add toggle button
  useEffect(() => {
    const container = descRef.current;
    if (!container) return;
    const boilerplate = container.querySelector('.jd-boilerplate-sections, .jd-secondary-sections') as HTMLElement | null;
    if (!boilerplate) return;
    boilerplate.style.display = 'none';
    const existingToggle = container.querySelector('.jd-boilerplate-toggle');
    if (existingToggle) existingToggle.remove();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'jd-boilerplate-toggle';
    button.textContent = 'Show company info & other details ▾';
    const handleToggle = () => {
      const isHidden = boilerplate.style.display === 'none';
      boilerplate.style.display = isHidden ? 'block' : 'none';
      button.textContent = isHidden ? 'Hide company info ▴' : 'Show company info & other details ▾';
    };
    button.addEventListener('click', handleToggle);
    boilerplate.parentNode?.insertBefore(button, boilerplate);
    return () => {
      button.removeEventListener('click', handleToggle);
      button.remove();
      boilerplate.style.display = '';
    };
  }, [job._id, job.DescriptionCleaned, job.Description]);

  // Skill highlighting — logged-in only
  useEffect(() => {
    const container = descRef.current;
    if (!container || !skills.length || !currentUser) return;
    container.querySelectorAll('mark.skill-match').forEach(mark => {
      const parent = mark.parentNode;
      if (parent) parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
    });
    container.normalize();
    const re = buildSkillsRegex(skills);
    if (!re) return;
    function highlightNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (!text.trim()) return;
        re!.lastIndex = 0;
        if (!re!.test(text)) return;
        re!.lastIndex = 0;
        const span = document.createElement('span');
        span.innerHTML = text.replace(re!, m => `<mark class="skill-match">${m}</mark>`);
        node.parentNode?.replaceChild(span, node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as Element).tagName?.toLowerCase();
        if (tag === 'mark' || tag === 'script' || tag === 'style') return;
        Array.from(node.childNodes).forEach(highlightNode);
      }
    }
    highlightNode(container);
  }, [job._id, skills]);

  const effectiveDate = job.PostedDate || job.scrapedAt || null;
  const wb = workplaceBadge(job);
  const sal = salaryDisplay(job);
  const autoTags = getAutoTags(job);
  const roleTone = roleBadgeStyle(autoTags.roleCategory);
  const isCB = comeBackMap.has(job._id);
  const cbEntry = comeBackMap.get(job._id);
  const applied = appliedJobIds.has(job._id);

  return (
    <div style={{ minWidth: 0, overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: mobileMode ? 12 : 16, alignItems: 'flex-start', flexDirection: mobileMode ? 'column' : 'row' }}>
        <CompanyLogo name={job.Company} url={job.ApplicationURL} domain={domain} size={48} borderRadius={12} style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: mobileMode ? '1.2rem' : '1.4rem',
              fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.02em',
              flex: '1 1 260px',
            }}>
              {job.JobTitle}
            </h2>
            {job.ATSPlatform && (
              <span style={{
                background: 'var(--paper2)', padding: '2px 8px', borderRadius: 6,
                fontSize: 11, color: 'var(--muted-ink)', flexShrink: 0, marginLeft: mobileMode ? 0 : 8,
              }}>
                {platformLabel[job.ATSPlatform] ?? job.ATSPlatform}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: mobileMode ? '6px 12px' : '4px 14px', marginTop: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}>
              <Building2 size={13} />{job.Company}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}>
              <MapPin size={13} />{job.Location}
            </span>
            {job.ContractType && job.ContractType !== 'N/A' && (
              <span style={{ fontSize: '0.82rem', color: 'var(--muted-ink)' }}>Type: {job.ContractType}</span>
            )}
            {job.Department && job.Department !== 'N/A' && (
              <span style={{ fontSize: '0.82rem', color: 'var(--muted-ink)' }}>Dept: {job.Department}</span>
            )}
          </div>
        </div>
      </div>

      {/* Badge row */}
      <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
        {wb && <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: wb.bg, color: wb.color, fontWeight: 600 }}>{wb.label}</span>}
        {sal && <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>Pay {sal}</span>}
        {job.Office && <Badge variant="neutral">Office {job.Office}</Badge>}
        {job.Team && job.Team !== job.Department && <Badge variant="neutral">Team {job.Team}</Badge>}
      </div>

      {/* Company Intel (Features 1 & 4) — logged-in only */}
      {currentUser && job.Company && (
        <CompanyIntel
          companyName={job.Company}
          rolePostedDate={job.PostedDate || job.scrapedAt || null}
        />
      )}
      {!currentUser && job.Company && (
        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 12,
          border: '1.5px dashed var(--border)',
          background: 'var(--paper2)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted-ink)' }}>
            Sign in to see <strong style={{ color: 'var(--primary)' }}>Company Radar</strong> — hiring activity, posting frequency & freshness
          </span>
        </div>
      )}

      {/* ── Job Details ─ compact chip strip ───────────────────────────────── */}
      <div style={{
        marginTop: 12,
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--paper2)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Accent line */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: 'linear-gradient(to bottom, var(--primary) 30%, transparent)',
          borderRadius: '10px 0 0 10px',
        }} />

        {/* Header + all detail chips in one flowing row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px 8px', paddingLeft: 6 }}>
          {/* Section label */}
          <span className="font-sketch" style={{
            fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 4,
          }}>Job Details</span>

          {/* Role category */}
          <span style={{
            fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
            background: roleTone.bg, color: roleTone.color, fontWeight: 700,
          }}>{autoTags.roleCategory || 'Other'}</span>

          {/* Experience band */}
          {autoTags.experienceBand && (
            <span style={{
              fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
              background: 'var(--surface-solid)', color: 'var(--ink)',
              border: '1px solid var(--border)', fontWeight: 600,
            }}>{autoTags.experienceBand}</span>
          )}

          {/* Domain chips */}
          {autoTags.domain.map(d => (
            <span key={d} style={{
              fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
              background: 'var(--surface-solid)', color: 'var(--muted-ink)',
              border: '1px solid var(--border)', fontWeight: 600,
            }}>{d}</span>
          ))}

          {/* Education */}
          {autoTags.education && (
            <span style={{
              fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
              background: 'var(--surface-solid)', color: 'var(--muted-ink)',
              border: '1px solid var(--border)', fontWeight: 600,
            }}>{autoTags.education}</span>
          )}

          {/* Urgency */}
          {autoTags.urgency && (
            <span style={{
              fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
              background: '#fee2e2', color: '#b91c1c', fontWeight: 700,
            }}>🔥 {autoTags.urgency}</span>
          )}

          {/* Tech stack */}
          {autoTags.techStack.map(tech => (
            <span key={tech} style={{
              fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
              background: 'var(--paper)', color: 'var(--subtle-ink)',
              border: '1px solid var(--border)', fontWeight: 600,
              fontFamily: 'ui-monospace, monospace',
            }}>{tech}</span>
          ))}

          {/* ATS Tags fallback */}
          {!autoTags.techStack.length && Array.isArray(job.Tags) && job.Tags.map(tag => (
            <span key={tag} style={{
              fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
              background: 'var(--paper)', color: 'var(--subtle-ink)',
              border: '1px solid var(--border)', fontWeight: 600,
            }}>{tag}</span>
          ))}

          {/* Divider */}
          <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0, alignSelf: 'center', margin: '0 2px' }} />

          {/* Timestamps inline */}
          <span style={{ fontSize: '0.7rem', color: 'var(--subtle-ink)', whiteSpace: 'nowrap' }}>
            <Clock size={10} style={{ verticalAlign: -1, marginRight: 3 }} />
            {effectiveDate
              ? new Date(effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : '—'}
          </span>
        </div>

        {/* Fresher badge — subtle row beneath */}
        {autoTags.isEntryLevel && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginTop: 7, marginLeft: 6,
            padding: '3px 10px', borderRadius: 999,
            background: '#dcfce7', color: '#166534',
            fontSize: '0.72rem', fontWeight: 700,
          }}>✓ Fresher Friendly</div>
        )}

        {/* AllLocations */}
        {Array.isArray(job.AllLocations) && job.AllLocations.length > 1 && (
          <div style={{ fontSize: '0.7rem', color: 'var(--subtle-ink)', marginTop: 5, marginLeft: 6, overflowWrap: 'anywhere' }}>
            Also: {job.AllLocations.join(' · ')}
          </div>
        )}
      </div>

      {/* Apply buttons (desktop only) */}
      {!mobileMode && (
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <a href={job.DirectApplyURL || job.ApplicationURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1 }}>
            <Button size="lg" style={{ width: '100%' }}>{COPY.jobs.applyNow} <ExternalLink size={14} /></Button>
          </a>
          {currentUser && (
            <button
              onClick={() => onToggleApplied(job._id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
                transition: 'all 0.18s', flexShrink: 0,
                background: applied ? 'var(--primary)' : 'transparent',
                color: applied ? '#fff' : 'var(--primary)',
                border: '1.5px solid var(--primary)',
              }}
            >
              <CheckCircle2 size={15} />
              {applied ? 'Applied' : 'Mark Applied'}
            </button>
          )}
        </div>
      )}

      {/* Sign-in prompt for non-logged users */}
      {!currentUser && !mobileMode && (
        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 12,
          border: '1.5px dashed var(--border)',
          background: 'var(--paper2)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--muted-ink)' }}>
            <a href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</a> to track applications, set reminders, match skills & more
          </span>
        </div>
      )}

      {/* Come Back Later */}
      {currentUser && (
        <div style={{ marginTop: 10 }}>
          {!cbExpanded && (
            <button
              onClick={() => { setCbNote(cbEntry?.note ?? ''); setCbExpanded(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
                transition: 'all 0.18s',
                background: isCB ? '#fef3c7' : 'transparent',
                color: isCB ? '#92400e' : 'var(--muted-ink)',
                border: isCB ? '1.5px solid #fcd34d' : '1.5px solid var(--border)',
              }}
            >
              <Clock size={14} style={{ color: isCB ? '#d97706' : 'var(--muted-ink)', flexShrink: 0 }} />
              {isCB ? 'Coming Back' : 'Come Back Later'}
              {isCB && cbEntry?.note && (
                <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#92400e', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  &middot; {cbEntry.note}
                </span>
              )}
            </button>
          )}
          {cbExpanded && (
            <div style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid #fcd34d', background: '#fffbeb' }}>
              <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600, marginBottom: 8 }}>
                {isCB ? 'Edit your note' : 'Why are you waiting?'}{' '}
                <span style={{ fontWeight: 400, color: '#b45309' }}>(optional)</span>
              </div>
              <textarea
                value={cbNote}
                onChange={e => setCbNote(e.target.value.slice(0, 200))}
                placeholder="e.g. Waiting for next funding round, need more experience…"
                rows={2}
                style={{
                  width: '100%', borderRadius: 8, border: '1px solid #fcd34d',
                  background: '#fff', padding: '8px 10px', fontSize: '0.85rem',
                  fontFamily: 'inherit', resize: 'none', outline: 'none',
                  color: '#92400e', boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: 3, marginBottom: 10 }}>
                {cbNote.length}/200
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => { onToggleComeBack(job._id, cbNote.trim()); setCbExpanded(false); }}
                  style={{ padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', background: '#d97706', color: '#fff', border: 'none', transition: 'all 0.18s' }}
                >
                  {isCB ? 'Save changes' : 'Flag it'}
                </button>
                {isCB && (
                  <button
                    onClick={() => { onRemoveComeBack(job._id); setCbExpanded(false); }}
                    style={{ padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 400, fontFamily: 'inherit', background: 'transparent', color: '#92400e', border: '1px solid #fcd34d', transition: 'all 0.18s' }}
                  >
                    Remove flag
                  </button>
                )}
                <button
                  onClick={() => setCbExpanded(false)}
                  style={{ padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 400, fontFamily: 'inherit', background: 'transparent', color: 'var(--muted-ink)', border: '1px solid var(--border)', transition: 'all 0.18s', marginLeft: mobileMode ? 0 : 'auto', width: mobileMode ? '100%' : 'auto' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

      {/* Skills match — logged-in only */}
      {currentUser && matchResult && colorInfo && (
        <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--paper2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: matchResult.matched.length + matchResult.unmatched.length > 0 ? 8 : 0 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colorInfo.color }}>
              Skills match: {matchResult.matched.length} of {matchResult.total}
            </span>
            {colorInfo.label && (
              <span style={{ background: '#bbf7d0', color: '#14532d', borderRadius: 999, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                {colorInfo.label}
              </span>
            )}
          </div>
          {(matchResult.matched.length > 0 || matchResult.unmatched.length > 0) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {matchResult.matched.map(s => (
                <span key={s} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontWeight: 600 }}>{s}</span>
              ))}
              {matchResult.unmatched.map(s => (
                <span key={s} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 999, background: 'var(--paper)', color: 'var(--muted-ink)', border: '1px solid var(--border)' }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <p className="font-sketch" style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary)', marginTop: 24, marginBottom: 12 }}>About This Role</p>
      <div
        ref={descRef}
        className="job-description-html jd-content"
        style={{ fontSize: mobileMode ? 13.5 : is3xl ? 15 : 14, lineHeight: 1.7, color: 'var(--muted-ink)', padding: '12px 0', maxWidth: '100%', overflowX: 'hidden' }}
        dangerouslySetInnerHTML={{ __html: job.DescriptionCleaned || job.Description || 'No description provided.' }}
      />

      {/* Lever structured lists */}
      {Array.isArray(job.DescriptionLists) && job.DescriptionLists.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {job.DescriptionLists.map((section, i) => (
            <div key={i} style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{section.text}</h4>
              <div className="job-description-html" style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--muted-ink)', maxWidth: '100%', overflowX: 'hidden' }} dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
          ))}
        </div>
      )}

      {/* Additional info */}
      {job.AdditionalInfo && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Additional Information</h4>
          <div className="job-description-html" style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--muted-ink)', maxWidth: '100%', overflowX: 'hidden' }} dangerouslySetInnerHTML={{ __html: job.AdditionalInfo }} />
        </div>
      )}

      {/* Similar Jobs (Feature 2) */}
      <SimilarJobs
        jobId={job._id}
        company={job.Company}
        userSkills={skills}
        onSelectJob={onSelectJob}
      />
    </div>
  );
}
