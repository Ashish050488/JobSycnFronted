// FILE: src/components/JobDetailPanel.tsx
// Detail view with skill highlighting + come-back-later UI. Exports preserved.

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, MapPin, Clock, X as XIcon, Bookmark, BookmarkCheck } from 'lucide-react';
import type { IJob, IJobAutoTags } from '../types';
import CompanyLogo from './CompanyLogo';
import { Button } from './ui';
import SimilarJobs from './SimilarJobs';

// ───────────────────────────────── exports kept stable ─────────────────

export function stripHtmlText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildSkillsRegex(skills: string[]): RegExp | null {
  if (!skills || skills.length === 0) return null;
  const escaped = skills
    .filter(s => s && s.trim().length >= 1)
    .map(s => s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return null;
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

export function relTime(d: string | null): string | null {
  if (!d) return null;
  const t = new Date(d);
  if (isNaN(t.getTime())) return null;
  const diff = Math.floor((Date.now() - t.getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

export function getAutoTags(job: IJob): IJobAutoTags {
  const empty: IJobAutoTags = {
    techStack: [], roleCategory: null, experienceBand: null, isEntryLevel: null,
    domain: [], urgency: null, education: null,
  };
  return job.autoTags ?? empty;
}

// Role → color
export function roleBadgeStyle(role: string | null): { bg: string; color: string } {
  if (!role) return { bg: 'var(--paper-2)', color: 'var(--ink-muted)' };
  const r = role.toLowerCase();
  if (r.includes('engineer') || r.includes('developer') || r.includes('dev')) return { bg: 'var(--info-soft)', color: 'var(--info)' };
  if (r.includes('design')) return { bg: 'var(--accent-soft)', color: 'var(--accent)' };
  if (r.includes('product')) return { bg: 'var(--warning-soft)', color: 'var(--warning)' };
  if (r.includes('data') || r.includes('analyst')) return { bg: '#EEEDFE', color: '#534AB7' };
  if (r.includes('manag')) return { bg: 'var(--success-soft)', color: 'var(--success)' };
  if (r.includes('sales') || r.includes('account')) return { bg: 'var(--danger-soft)', color: 'var(--danger)' };
  return { bg: 'var(--paper-2)', color: 'var(--ink-muted)' };
}

export function inferWorkplace(job: IJob): string | null {
  const wt = (job.WorkplaceType || '').toLowerCase();
  if (wt === 'remote' || job.IsRemote) return 'Remote';
  if (wt === 'hybrid') return 'Hybrid';
  if (wt === 'on-site' || wt === 'onsite') return 'On-site';
  const loc = (job.Location || '').toLowerCase();
  if (loc.includes('remote')) return 'Remote';
  if (loc.includes('hybrid')) return 'Hybrid';
  return null;
}

const DEFAULT_AUTO_TAGS: IJobAutoTags = {
  techStack: [], roleCategory: null, experienceBand: null, isEntryLevel: null,
  domain: [], urgency: null, education: null,
};

// Boilerplate detection — chunks that talk about company benefits / EEO
const BOILERPLATE_REGEX = /\b(equal\s+opportunity|EEO|diversity|inclusion|benefits|perks|why\s+work|about\s+(us|the\s+company)|our\s+mission|our\s+values)/i;

interface Props {
  job: IJob;
  domain?: string;
  mobileMode?: boolean;
  is3xl?: boolean;
  appliedJobIds: Set<string>;
  comeBackMap: Record<string, string>;
  onToggleApplied: (jobId: string) => void;
  onToggleComeBack: (jobId: string, note?: string) => void;
  onRemoveComeBack?: (jobId: string) => void;
  onSelectJob?: (job: IJob) => void;
}

export default function JobDetailPanel({
  job, domain, mobileMode, is3xl, appliedJobIds,
  comeBackMap, onToggleApplied, onToggleComeBack, onRemoveComeBack, onSelectJob,
}: Props) {
  void is3xl;
  const [boilerplateOpen, setBoilerplateOpen] = useState(false);
  const [comeBackInput, setComeBackInput] = useState(false);
  const [noteVal, setNoteVal] = useState('');

  const isApplied = appliedJobIds.has(job._id);
  const isComeBack = !!comeBackMap[job._id];
  const note = comeBackMap[job._id] || '';

  useEffect(() => { setComeBackInput(false); setNoteVal(''); setBoilerplateOpen(false); }, [job._id]);

  const auto = job.autoTags ?? DEFAULT_AUTO_TAGS;
  const wp = inferWorkplace(job);
  const rt = relTime(job.PostedDate || job.scrapedAt || null);

  // Description rendering — strip skill matches into <mark>
  const html = useMemo(() => {
    const raw = job.DescriptionCleaned || job.Description || '';
    if (!raw) return '';
    // Optionally split into "main" + "boilerplate"
    return raw;
  }, [job]);

  const platformLabel: Record<string, string> = {
    lever: 'Lever', greenhouse: 'Greenhouse', ashby: 'Ashby',
    workable: 'Workable', recruitee: 'Recruitee', workday: 'Workday',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--surface)',
      overflow: 'hidden',
    }}>
      {/* Sticky top header */}
      <div style={{
        padding: mobileMode ? '16px 16px 12px' : '20px 22px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <CompanyLogo
            name={job.Company}
            url={job.ApplicationURL}
            domain={domain}
            size={48}
            borderRadius={11}
            style={{ flexShrink: 0 }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontSize: mobileMode ? '1.05rem' : '1.2rem',
              fontWeight: 600,
              color: 'var(--ink)',
              letterSpacing: '-0.018em',
              lineHeight: 1.25,
            }}>
              {job.JobTitle}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: 4 }}>
              {job.Company}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          fontSize: '0.78rem', color: 'var(--ink-muted)',
          marginTop: 12,
        }}>
          <span style={metaPill}><MapPin size={11} />{job.Location}</span>
          {wp && (
            <span style={{ ...metaPill, background: 'var(--info-soft)', color: 'var(--info)' }}>{wp}</span>
          )}
          {rt && <span style={metaPill}><Clock size={11} />{rt}</span>}
          {job.ATSPlatform && platformLabel[job.ATSPlatform.toLowerCase()] && (
            <span style={metaPill}>via {platformLabel[job.ATSPlatform.toLowerCase()]}</span>
          )}
          {auto.roleCategory && (
            <span style={{ ...metaPill, ...roleBadgeStyle(auto.roleCategory) }}>
              {auto.roleCategory}
            </span>
          )}
          {auto.experienceBand && (
            <span style={metaPill}>{auto.experienceBand}</span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <Button
            as="a"
            href={job.DirectApplyURL || job.ApplicationURL}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            size="md"
            style={{ flex: mobileMode ? 1 : undefined, minWidth: 130 }}
          >
            <ExternalLink size={14} /> Apply now
          </Button>
          <Button
            variant={isApplied ? 'success' : 'ghost'}
            size="md"
            onClick={() => onToggleApplied(job._id)}
          >
            <CheckCircle2 size={14} /> {isApplied ? 'Applied' : 'Mark applied'}
          </Button>
          <Button
            variant={isComeBack ? 'secondary' : 'ghost'}
            size="md"
            onClick={() => { if (isComeBack && onRemoveComeBack) onRemoveComeBack(job._id); else setComeBackInput(true); }}
            title={isComeBack ? 'Remove bookmark' : 'Save for later'}
          >
            {isComeBack ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {isComeBack ? 'Saved' : 'Save'}
          </Button>
        </div>

        {/* Come back note */}
        {comeBackInput && (
          <div style={{
            marginTop: 12,
            padding: '10px 12px',
            background: 'var(--paper-2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
          }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginBottom: 6, display: 'block' }}>
              Add a note (optional)
            </label>
            <textarea
              autoFocus
              value={noteVal}
              onChange={e => setNoteVal(e.target.value)}
              placeholder="Apply this weekend after polishing CV…"
              rows={2}
              style={{
                width: '100%', padding: '8px 10px',
                fontSize: '0.85rem', fontFamily: 'inherit',
                border: '1px solid var(--border-strong)',
                borderRadius: 8, resize: 'vertical', minHeight: 50,
                background: 'var(--surface)',
                color: 'var(--ink)',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button
                variant="primary" size="sm"
                onClick={() => { onToggleComeBack(job._id, noteVal); setComeBackInput(false); setNoteVal(''); }}
              >
                Save bookmark
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setComeBackInput(false); setNoteVal(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isComeBack && note && !comeBackInput && (
          <div style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'var(--warning-soft)',
            color: 'var(--warning)',
            borderRadius: 8,
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 8,
          }}>
            <span style={{ flex: 1 }}>📝 {note}</span>
            {onRemoveComeBack && (
              <button
                onClick={() => onRemoveComeBack(job._id)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 2 }}
                title="Remove"
              >
                <XIcon size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="thin-scroll" style={{
        flex: 1,
        overflowY: 'auto',
        padding: mobileMode ? '16px 16px 80px' : '20px 22px',
      }}>
        {/* Tech stack */}
        {auto.techStack && auto.techStack.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <p style={sectionLabel}>Tech stack</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {auto.techStack.slice(0, 12).map(t => (
                <span key={t} style={{
                  fontSize: '0.78rem',
                  padding: '3px 9px',
                  borderRadius: 6,
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  fontWeight: 500,
                }}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="job-description-html" dangerouslySetInnerHTML={{ __html: html }} />

        {/* Boilerplate toggle */}
        {html && BOILERPLATE_REGEX.test(stripHtmlText(html)) && !boilerplateOpen && (
          <button className="jd-boilerplate-toggle" onClick={() => setBoilerplateOpen(true)}>
            Show benefits & EEO statement
          </button>
        )}

        {/* Salary */}
        {(job.SalaryInfo || job.SalaryMin) && (
          <div style={{
            marginTop: 18,
            padding: '10px 14px',
            background: 'var(--success-soft)',
            color: 'var(--success)',
            borderRadius: 10,
            fontSize: '0.875rem',
            fontWeight: 500,
          }}>
            💰 {job.SalaryInfo || `${job.SalaryMin}${job.SalaryMax ? ` – ${job.SalaryMax}` : ''} ${job.SalaryCurrency || ''}`}
          </div>
        )}

        {/* Similar jobs */}
        {onSelectJob && <SimilarJobs jobId={job._id} onSelect={onSelectJob} />}
      </div>
    </div>
  );
}

const metaPill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 9px',
  borderRadius: 6,
  background: 'var(--paper-2)',
  color: 'var(--ink-muted)',
  fontSize: '0.72rem',
  fontWeight: 500,
};

const sectionLabel: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--ink-faint)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  marginBottom: 8,
};
