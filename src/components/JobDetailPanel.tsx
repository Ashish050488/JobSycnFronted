// FILE: src/components/JobDetailPanel.tsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Building2, Clock, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Badge, Button } from './ui';
import { COPY } from '../theme/brand';
import type { IJob, IJobAutoTags } from '../types';

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
    case 'Frontend':   return { bg: '#dbeafe', color: '#1e40af' };
    case 'Backend':    return { bg: '#ede9fe', color: '#5b21b6' };
    case 'Full Stack': return { bg: '#e0e7ff', color: '#3730a3' };
    case 'DevOps/SRE': return { bg: '#ffedd5', color: '#9a3412' };
    case 'Data':       return { bg: '#ccfbf1', color: '#115e59' };
    case 'ML/AI':      return { bg: '#fce7f3', color: '#9d174d' };
    case 'QA':         return { bg: '#f3f4f6', color: '#374151' };
    case 'Mobile':     return { bg: '#dcfce7', color: '#166534' };
    default:           return { bg: 'var(--paper2)', color: 'var(--muted-ink)' };
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

// ─── LogoImg ─────────────────────────────────────────────────────────────────

function logoDomainFromUrl(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return 'example.com'; }
}

function LogoImg({ job, size }: { job: IJob; size: number }) {
  const [err, setErr] = useState(false);
  return err ? (
    <span style={{
      fontFamily: "'Playfair Display',serif", fontSize: size * 0.55,
      color: 'var(--primary)', fontWeight: 700, display: 'flex',
      alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%',
    }}>
      {job.Company.charAt(0)}
    </span>
  ) : (
    <img
      src={`https://logo.clearbit.com/${logoDomainFromUrl(job.ApplicationURL)}`}
      alt={job.Company}
      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      onError={() => setErr(true)}
    />
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface JobDetailPanelProps {
  job: IJob;
  mobileMode?: boolean;
  is3xl: boolean;
  appliedJobIds: Set<string>;
  comeBackMap: Map<string, { note: string; addedAt: string }>;
  onToggleApplied: (jobId: string) => Promise<void>;
  onToggleComeBack: (jobId: string, note: string) => void;
  onRemoveComeBack: (jobId: string) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JobDetailPanel({
  job,
  mobileMode = false,
  is3xl,
  appliedJobIds,
  comeBackMap,
  onToggleApplied,
  onToggleComeBack,
  onRemoveComeBack,
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

  // Skill highlighting
  useEffect(() => {
    const container = descRef.current;
    if (!container || !skills.length) return;
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
    <div>
      {/* Header */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{
          width: 48, height: 48, flexShrink: 0, background: 'var(--surface-solid)',
          border: '1px solid var(--border)', borderRadius: 10, display: 'flex',
          alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 6,
        }}>
          <LogoImg job={job} size={48} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: mobileMode ? '1.2rem' : '1.4rem',
              fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.02em',
            }}>
              {job.JobTitle}
            </h2>
            {job.ATSPlatform && (
              <span style={{
                background: 'var(--paper2)', padding: '2px 8px', borderRadius: 6,
                fontSize: 11, color: 'var(--muted-ink)', flexShrink: 0, marginLeft: 8,
              }}>
                {platformLabel[job.ATSPlatform] ?? job.ATSPlatform}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 8 }}>
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

      {/* Job details box */}
      <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 14, background: 'var(--paper2)', border: '1px solid var(--border)' }}>
        <div className="font-sketch" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Job Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Role</span>
            <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: roleTone.bg, color: roleTone.color, fontWeight: 600 }}>{autoTags.roleCategory || 'Other'}</span>
          </div>
          {autoTags.experienceBand && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Experience</span>
              <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: 'var(--surface-solid)', color: 'var(--ink)', fontWeight: 600 }}>{autoTags.experienceBand}</span>
            </div>
          )}
          {autoTags.domain.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Domain</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {autoTags.domain.map(domain => (
                  <span key={domain} style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: 'var(--surface-solid)', color: 'var(--ink)', fontWeight: 600 }}>{domain}</span>
                ))}
              </div>
            </div>
          )}
          {autoTags.education && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Education</span>
              <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: 'var(--surface-solid)', color: 'var(--ink)', fontWeight: 600 }}>{autoTags.education}</span>
            </div>
          )}
          {autoTags.urgency && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Urgency</span>
              <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>{autoTags.urgency}</span>
            </div>
          )}
          {autoTags.techStack.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86, paddingTop: 4 }}>Tech Stack</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                {autoTags.techStack.map(tech => (
                  <span key={tech} style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: 'var(--surface-solid)', color: 'var(--subtle-ink)', fontWeight: 600 }}>{tech}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        {autoTags.isEntryLevel && (
          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: '#dcfce7', color: '#166534', fontSize: '0.84rem', fontWeight: 600 }}>
            Fresher Friendly: This role appears suitable for freshers and entry-level candidates.
          </div>
        )}
      </div>

      {/* AllLocations */}
      {Array.isArray(job.AllLocations) && job.AllLocations.length > 1 && (
        <div style={{ fontSize: 12, color: 'var(--muted-ink)', marginTop: 8 }}>
          Also: {job.AllLocations.join(' | ')}
        </div>
      )}

      {/* Timestamps */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.78rem', color: 'var(--muted-ink)' }}>
        <span>
          <Clock size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
          {effectiveDate
            ? `${COPY.jobs.postedPrefix} ${new Date(effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            : COPY.jobs.postedNA}
        </span>
        {job.scrapedAt && <span>Scraped: {relTime(job.scrapedAt) ?? 'N/A'}</span>}
      </div>

      {/* ATS Tags fallback */}
      {!autoTags.techStack.length && Array.isArray(job.Tags) && job.Tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {job.Tags.map(tag => (
            <span key={tag} style={{ background: 'var(--paper2)', borderRadius: 999, padding: '2px 10px', fontSize: 12, color: 'var(--muted-ink)' }}>{tag}</span>
          ))}
        </div>
      )}

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
                  style={{ padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 400, fontFamily: 'inherit', background: 'transparent', color: 'var(--muted-ink)', border: '1px solid var(--border)', transition: 'all 0.18s', marginLeft: 'auto' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

      {/* Skills match */}
      {matchResult && colorInfo && (
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
        style={{ fontSize: is3xl ? 15 : 14, lineHeight: 1.7, color: 'var(--muted-ink)', padding: '12px 0', maxWidth: is3xl ? 800 : 720 }}
        dangerouslySetInnerHTML={{ __html: job.DescriptionCleaned || job.Description || 'No description provided.' }}
      />

      {/* Lever structured lists */}
      {Array.isArray(job.DescriptionLists) && job.DescriptionLists.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {job.DescriptionLists.map((section, i) => (
            <div key={i} style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{section.text}</h4>
              <div className="job-description-html" style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--muted-ink)' }} dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
          ))}
        </div>
      )}

      {/* Additional info */}
      {job.AdditionalInfo && (
        <div style={{ marginTop: 16 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Additional Information</h4>
          <div className="job-description-html" style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--muted-ink)' }} dangerouslySetInnerHTML={{ __html: job.AdditionalInfo }} />
        </div>
      )}
    </div>
  );
}
