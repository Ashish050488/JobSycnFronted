// FILE: src/pages/Today/Sidebar.tsx
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import CompanyLogo from '../../components/CompanyLogo';
import { SectionHead, type LeaderboardCompany } from './shared';

interface Props {
  isDesktop: boolean;
  loading: boolean;
  topCompanies: LeaderboardCompany[];
}

export default function Sidebar({ isDesktop, loading, topCompanies }: Props) {
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
    </aside>
  );
}
