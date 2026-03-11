// FILE: src/components/JobCard.tsx
import { useState } from 'react';
import { MapPin, Building2, ExternalLink, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { IJob } from '../types';
import { Badge, Button } from './ui';

interface Props {
  job: IJob;
}

export default function JobCard({ job }: Props) {
  const [imgErr, setImgErr] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const relTime = (d: string | null) => {
    if (!d) return null;
    const posted = new Date(d);
    if (isNaN(posted.getTime())) return null;
    const diff = Math.floor((Date.now() - posted.getTime()) / 86400000);
    if (diff <= 0) return 'Today';
    if (diff === 1) return '1d ago';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return `${Math.floor(diff / 30)}mo ago`;
  };

  const domain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'google.com';
    }
  };

  const effectiveDate = job.PostedDate || job.scrapedAt || null;
  const rt = relTime(effectiveDate);
  const hasLongDesc = job.Description && job.Description.length > 300;

  return (
    <div
      className="job-card anim-up"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        transition: 'border-color 0.25s,transform 0.25s,box-shadow 0.25s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateX(3px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: 6,
            }}
          >
            {!imgErr ? (
              <img
                src={`https://logo.clearbit.com/${domain(job.ApplicationURL)}`}
                alt={job.Company}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                onError={() => setImgErr(true)}
              />
            ) : (
              <span
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: '1.2rem',
                  color: 'var(--acid)',
                  fontWeight: 700,
                }}
              >
                {job.Company.charAt(0)}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ minWidth: 0 }}>
              <a
                href={job.ApplicationURL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <h3
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'color 0.18s',
                  }}
                  onMouseEnter={e => ((e.currentTarget.style.color = 'var(--acid)'))}
                  onMouseLeave={e => ((e.currentTarget.style.color = 'var(--text-primary)'))}
                >
                  {job.JobTitle}
                  <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </h3>
              </a>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '5px 14px',
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Building2 size={12} />
                  {job.Company}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <MapPin size={12} />
                  {job.Location}
                </span>
                {rt && (
                  <Badge variant="acid" style={{ fontSize: '0.65rem' }}>
                    <Clock size={9} />
                    {rt}
                  </Badge>
                )}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Clock size={12} />
                  {effectiveDate
                    ? `Posted: ${new Date(effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Posted: N/A'}
                </span>
              </div>
            </div>

            {/* Expandable Description */}
            {job.Description && (
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.7,
                    maxHeight: expanded ? 'none' : '80px',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'max-height 0.3s ease',
                  }}
                >
                  {job.Description}
                  {!expanded && hasLongDesc && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 40,
                        background: 'linear-gradient(to bottom, transparent, var(--bg-surface))',
                      }}
                    />
                  )}
                </div>
                {hasLongDesc && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                      marginTop: 8,
                      background: 'none',
                      border: 'none',
                      color: 'var(--acid)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: 0,
                      fontFamily: 'inherit',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={e => ((e.currentTarget.style.opacity = '0.7'))}
                    onMouseLeave={e => ((e.currentTarget.style.opacity = '1'))}
                  >
                    {expanded ? (
                      <>
                        Show less <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {job.ContractType && job.ContractType !== 'N/A' && (
                <Badge variant="neutral">{job.ContractType}</Badge>
              )}
              {job.Department && job.Department !== 'N/A' && job.Department !== '' && (
                <Badge variant="neutral">{job.Department}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.02)',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <a href={job.ApplicationURL} target="_blank" rel="noopener noreferrer">
          <Button size="sm">
            Apply Now <ExternalLink size={11} />
          </Button>
        </a>
      </div>
    </div>
  );
}