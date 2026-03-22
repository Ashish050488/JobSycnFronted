// FILE: src/components/JobListItem.tsx
import { useState, memo } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui';
import type { IJob } from '../types';

export type CompactBadge = { key: string; label: string; bg: string; color: string };

export interface JobListItemProps {
  job: IJob;
  isSelected: boolean;
  isApplied: boolean;
  isComeBack: boolean;
  comeBackNote: string;
  isNew: boolean;
  relativeTime: string | null;
  visibleBadges: CompactBadge[];
  showSkillMatch: boolean;
  skillMatchText: string;
  skillMatchBg: string;
  skillMatchColor: string;
  onSelect: (job: IJob) => void;
}

function logoDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'example.com';
  }
}

const JobListItem = memo(function JobListItem({
  job,
  isSelected,
  isApplied,
  isComeBack,
  comeBackNote,
  isNew,
  relativeTime,
  visibleBadges,
  showSkillMatch,
  skillMatchText,
  skillMatchBg,
  skillMatchColor,
  onSelect,
}: JobListItemProps) {
  const [logoError, setLogoError] = useState(false);

  return (
    <div
      onClick={() => onSelect(job)}
      style={{
        minHeight: 80,
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        background: isSelected ? 'var(--primary-soft)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
        transition: 'all 0.18s',
        opacity: isApplied ? 0.55 : 1,
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--paper2)';
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: 'var(--surface-solid)', border: '1px solid var(--border)',
          borderRadius: 999, display: 'flex', alignItems: 'center',
          justifyContent: 'center', overflow: 'hidden', padding: 4,
        }}>
          {logoError ? (
            <span style={{
              fontFamily: "'Playfair Display',serif", fontSize: '1rem',
              color: 'var(--primary)', fontWeight: 700, display: 'flex',
              alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%',
            }}>
              {(job.Company || '?').charAt(0)}
            </span>
          ) : (
            <img
              src={`https://logo.clearbit.com/${logoDomainFromUrl(job.ApplicationURL)}`}
              alt={job.Company}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={() => setLogoError(true)}
            />
          )}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)',
            lineHeight: 1.3, display: 'flex', alignItems: 'flex-start', gap: 5,
          }}>
            <span style={{
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {job.JobTitle}
            </span>
            {isApplied && (
              <CheckCircle2 size={14} style={{ flexShrink: 0, color: '#16a34a', marginTop: 2 }} />
            )}
            {!isApplied && isComeBack && (
              <Clock size={14} style={{ flexShrink: 0, color: '#d97706', marginTop: 2 }} />
            )}
          </div>
          <div style={{
            display: 'flex', gap: 6, alignItems: 'center',
            marginTop: 4, fontSize: '0.78rem', color: 'var(--muted-ink)',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.Company}
            </span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.Location}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {isNew && (
          <span style={{
            fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999,
            background: '#FF6B6B', color: '#fff', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            NEW
          </span>
        )}
        {relativeTime && (
          <Badge variant="acid" style={{ fontSize: '0.62rem' }}>
            <Clock size={8} />{relativeTime}
          </Badge>
        )}
        {visibleBadges.map(badge => (
          <span
            key={badge.key}
            style={{
              fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999,
              background: badge.bg, color: badge.color, fontWeight: 600,
            }}
          >
            {badge.label}
          </span>
        ))}
        {showSkillMatch && (
          <span style={{
            fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999,
            background: skillMatchBg, color: skillMatchColor, fontWeight: 600,
          }}>
            {skillMatchText}
          </span>
        )}
      </div>

      {isComeBack && comeBackNote && (
        <div style={{
          fontSize: '0.72rem', color: '#92400e', fontStyle: 'italic',
          marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', opacity: 0.85,
        }}>
          {comeBackNote.length > 45 ? comeBackNote.slice(0, 45) + '\u2026' : comeBackNote}
        </div>
      )}
    </div>
  );
});

export default JobListItem;
