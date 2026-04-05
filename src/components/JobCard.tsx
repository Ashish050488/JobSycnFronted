// FILE: src/components/JobCard.tsx
import { useEffect, useState } from 'react';
import { MapPin, Building2, ExternalLink, Clock } from 'lucide-react';
import type { IJob } from '../types';
import CompanyLogo from './CompanyLogo';
import { Badge, Button } from './ui';
import { COPY } from '../theme/brand';


interface Props {
  job: IJob;
  domain?: string;
}

export default function JobCard({ job, domain }: Props) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const workplaceBadge = (): { label: string; bg: string; color: string } | null => {
    const wt = (job.WorkplaceType ?? '').toLowerCase();
    if (wt === 'remote' || job.IsRemote) return { label: '🌐 Remote', bg: '#d1fae5', color: '#065f46' };
    if (wt === 'hybrid') return { label: '⚡ Hybrid', bg: '#fef3c7', color: '#92400e' };
    if (wt === 'on-site' || wt === 'onsite') return { label: '🏢 On-site', bg: '#dbeafe', color: '#1e40af' };
    return null;
  };

  const salaryDisplay = (): string | null => {
    if (job.SalaryInfo) return job.SalaryInfo;
    if (job.SalaryMin && job.SalaryMax) {
      const fmt = (n: number) => (job.SalaryCurrency === 'INR' || !job.SalaryCurrency) && n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}K`;
      const curr = job.SalaryCurrency === 'INR' ? '₹' : job.SalaryCurrency === 'USD' ? '$' : (job.SalaryCurrency ? job.SalaryCurrency + ' ' : '');
      return `${curr}${fmt(job.SalaryMin)} – ${curr}${fmt(job.SalaryMax)}`;
    }
    return null;
  };


  const effectiveDate = job.PostedDate || job.scrapedAt || null;
  const rt = relTime(effectiveDate);

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
      <div style={{ padding: 'clamp(14px, 3.5vw, 20px) clamp(14px, 4vw, 24px)' }}>
        <div style={{ display: 'flex', gap: isMobile ? 12 : 16, alignItems: 'flex-start' }}>
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
            <CompanyLogo name={job.Company} url={job.ApplicationURL} domain={domain} size={44} borderRadius={10} />
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
                  <span style={{ minWidth: 0 }}>{job.JobTitle}</span>
                  <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
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
                    ? `${COPY.jobs.postedPrefix} ${new Date(effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : COPY.jobs.postedNA}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {job.ContractType && job.ContractType !== 'N/A' && (
                <Badge variant="neutral">{job.ContractType}</Badge>
              )}
              {job.Department && job.Department !== 'N/A' && job.Department !== '' && (
                <Badge variant="neutral">{job.Department}</Badge>
              )}
              {(() => { const wb = workplaceBadge(); return wb ? (
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, background: wb.bg, color: wb.color, fontWeight: 600 }}>{wb.label}</span>
              ) : null; })()}
              {(() => { const sal = salaryDisplay(); return sal ? (
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>💰 {sal}</span>
              ) : null; })()}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: 'clamp(10px, 2.5vw, 12px) clamp(14px, 4vw, 24px)',
          borderTop: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.02)',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          justifyContent: isMobile ? 'stretch' : 'space-between',
          alignItems: 'center',
        }}
      >
        <a href={job.DirectApplyURL || job.ApplicationURL} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: isMobile ? '100%' : 'auto' }}>
          <Button size="sm" style={{ width: isMobile ? '100%' : undefined }}>
            {COPY.jobs.applyNow} <ExternalLink size={11} />
          </Button>
        </a>
      </div>
    </div>
  );
}
