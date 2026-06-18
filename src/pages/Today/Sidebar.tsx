// FILE: src/pages/Today/Sidebar.tsx
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, ExternalLink, TrendingUp } from 'lucide-react';
import type { AppliedJobDetail } from '../../types';
import CompanyLogo from '../../components/CompanyLogo';
import { SectionHead, type LeaderboardCompany } from './shared';

interface Props {
  isDesktop: boolean;
  loading: boolean;
  topCompanies: LeaderboardCompany[];
  recentApps: AppliedJobDetail[];
}

export default function Sidebar({ isDesktop, loading, topCompanies, recentApps }: Props) {
  return (
    <aside style={{
      display: 'flex', flexDirection: 'column', gap: 28,
      ...(isDesktop ? { position: 'sticky', top: 88 } : {}),
    }}>
      <section>
        <SectionHead eyebrow="Live signal" title="Hiring fast this week" linkLabel="See all" linkTo="/hiring" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />
            ))
          ) : topCompanies.length === 0 ? (
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>No data yet.</p>
          ) : (
            topCompanies.map((c, i) => (
              <Link key={c.company} to="/hiring" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 11, textDecoration: 'none',
                transition: 'all 160ms ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-faint)',
                  width: 22, textAlign: 'center', flexShrink: 0,
                }}>#{i + 1}</span>
                <CompanyLogo name={c.company} domain={c.domain} size={32} borderRadius={9} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <TrendingUp size={10} /> +{c.newThisWeek} new this week
                  </div>
                </div>
                <ArrowRight size={14} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <SectionHead eyebrow="Your activity" title="Recent applications" linkLabel="Track all" linkTo="/progress" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, borderRadius: 11 }} />
            ))
          ) : recentApps.length === 0 ? (
            <div style={{
              padding: '20px 14px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center',
            }}>
              <CheckCircle2 size={20} style={{ color: 'var(--ink-faint)', marginBottom: 8 }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
                No applications yet. Apply to a job to start tracking.
              </p>
            </div>
          ) : (
            recentApps.map(a => (
              <a key={a.jobId}
                href={a.applicationURL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 11,
                  textDecoration: 'none',
                }}
              >
                <CompanyLogo name={a.company} size={28} borderRadius={8} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{a.jobTitle}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> {a.company}
                  </div>
                </div>
                <ExternalLink size={12} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
              </a>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
