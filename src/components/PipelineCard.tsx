import { useState } from 'react';
import { ExternalLink, MapPin, Building2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

// Stage configuration — labels and colors
const STAGES = {
  applied: { label: 'Applied', bg: 'var(--primary-soft)', color: 'var(--primary)' },
  screening: { label: 'Screening', bg: 'var(--info-soft)', color: 'var(--info)' },
  interview: { label: 'Interview', bg: '#EEEDFE', color: '#534AB7' },
  offer: { label: 'Offer', bg: 'var(--warning-soft)', color: 'var(--warning)' },
  accepted: { label: 'Accepted', bg: 'var(--success-soft)', color: 'var(--success)' },
  rejected: { label: 'Rejected', bg: 'var(--danger-soft)', color: 'var(--danger)' },
  ghosted: { label: 'Ghosted', bg: 'var(--paper2)', color: 'var(--subtle-ink)' },
} as const;

const STAGE_ORDER = ['applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'ghosted'] as const;
type StageName = keyof typeof STAGES;

export type { StageName };
export { STAGES, STAGE_ORDER };

interface PipelineCardProps {
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
  onStageChange: (jobId: string, newStage: string) => void;
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 7) return days + 'd ago';
  if (days < 14) return '1w ago';
  if (days < 30) return Math.floor(days / 7) + 'w ago';
  return Math.floor(days / 30) + 'mo ago';
}

export default function PipelineCard({
  jobId, jobTitle, company, location, department,
  applicationURL, stage, stageUpdatedAt, appliedAt, isListingActive, onStageChange,
}: PipelineCardProps) {
  const [hovered, setHovered] = useState(false);
  const stageKey = (STAGES[stage as StageName] ? stage : 'applied') as StageName;
  const stageConfig = STAGES[stageKey];

  // Inline SVG chevron for select dropdown, colored by stage text color
  const chevronSvg = encodeURIComponent(
    `<svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="${stageConfig.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  );

  return (
    <div
      style={{
        background: 'var(--surface-solid)',
        border: `1.25px solid ${hovered ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '16px 18px',
        transition: 'all 0.22s',
        boxShadow: hovered ? 'var(--shadow-sm, 0 2px 8px rgba(80,60,180,0.06))' : 'none',
        transform: hovered ? 'translateY(-1px)' : 'none',
        cursor: 'pointer',
        marginBottom: 10,
        userSelect: 'none',
        opacity: isListingActive ? 1 : 0.72,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Row 1: Logo + Info + Stage selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Company logo */}
        <div style={{
          width: 40, height: 40, flexShrink: 0, borderRadius: 10,
          background: 'var(--paper2)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', padding: 4,
        }}>
          <CompanyLogo name={company} url={applicationURL} size={40} borderRadius={10} />
        </div>

        {/* Job info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title — link only when listing is still active */}
          {applicationURL && isListingActive ? (
            <a href={applicationURL} target="_blank" rel="noopener noreferrer"
              style={{
                textDecoration: 'none', color: 'var(--ink)', fontWeight: 600, fontSize: '0.92rem',
                display: 'flex', alignItems: 'center', gap: 6, lineHeight: 1.3
              }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {jobTitle}
              </span>
              <ExternalLink size={12} style={{ flexShrink: 0, color: 'var(--muted-ink)' }} />
            </a>
          ) : (
            <div style={{
              fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink)', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {jobTitle}
            </div>
          )}
          {/* Listing closed badge */}
          {!isListingActive && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              marginTop: 4,
              background: 'var(--danger-soft)', color: 'var(--danger)',
              fontSize: '0.68rem', fontWeight: 700,
              borderRadius: 999, padding: '2px 8px',
              letterSpacing: '0.02em',
            }}>
              Listing closed
            </span>
          )}

          {/* Company + Location + Department */}
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center', marginTop: 4,
            fontSize: '0.78rem', color: 'var(--muted-ink)', flexWrap: 'wrap'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Building2 size={11} /> {company}
            </span>
            {location && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={11} /> {location}
                </span>
              </>
            )}
            {department && department !== 'N/A' && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{department}</span>
              </>
            )}
          </div>
        </div>

        {/* Stage selector */}
        <select
          value={stageKey}
          onChange={e => onStageChange(jobId, e.target.value)}
          style={{
            appearance: 'none',
            padding: '5px 28px 5px 12px',
            borderRadius: 999,
            border: '1.5px solid transparent',
            background: stageConfig.bg,
            color: stageConfig.color,
            fontSize: '0.75rem',
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            flexShrink: 0,
            backgroundImage: `url("data:image/svg+xml,${chevronSvg}")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            outline: 'none',
            minWidth: 95,
            marginLeft: 8,
            transition: 'background-color 0.3s, color 0.3s, box-shadow 0.18s',
          }}
          onFocus={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.1))')}
          onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
        >
          {STAGE_ORDER.map(s => (
            <option key={s} value={s}>{STAGES[s].label}</option>
          ))}
        </select>
      </div>

      {/* Row 2: Applied time + Stage updated time */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 10,
        fontSize: '0.72rem', color: 'var(--subtle-ink)'
      }}>
        <span>Applied {relativeTime(appliedAt)}</span>
        {stage !== 'applied' && (
          <span>· Stage updated {relativeTime(stageUpdatedAt)}</span>
        )}
      </div>
    </div>
  );
}
