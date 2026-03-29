import { useState, type ReactNode } from 'react';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { Badge } from './ui';
import type { ICompany } from '../types';
import CompanyLogo from './CompanyLogo';

interface Props {
  company: ICompany;
  /** If true, show admin overlay actions */
  adminActions?: ReactNode;
}

export default function CompanyCard({ company, adminActions }: Props) {
  const [hov, setHov] = useState(false);
  const visit = () => {
    if (adminActions) return; // Don't open link in admin mode
    let u = (company.domain || '').trim(); if (!/^https?:\/\//i.test(u)) u = `https://${u}`; window.open(u, '_blank');
  };

  return (
    <div
      className="sketch-card"
      onClick={visit}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      role={adminActions ? undefined : 'link'}
      tabIndex={0}
      onKeyDown={e => { if (!adminActions && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); visit(); } }}
      style={{
        background: hov ? 'var(--paper2)' : 'var(--surface-solid)',
        borderColor: hov ? 'var(--border-strong)' : undefined,
        padding: 'clamp(14px, 3vw, 22px) clamp(12px, 3vw, 20px)',
        cursor: adminActions ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.22s cubic-bezier(0.2,0.8,0.2,1)',
        transform: hov && !adminActions ? 'translateY(-3px)' : 'none',
        boxShadow: hov ? 'var(--shadow-md)' : 'none',
        minHeight: 140,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Primary corner glow on hover */}
      {hov && !adminActions && <div style={{ position: 'absolute', top: -30, right: -30, width: 70, height: 70, background: 'var(--primary-soft)', borderRadius: '50%', filter: 'blur(18px)', pointerEvents: 'none' }} />}

      {/* External link icon */}
      {!adminActions && <div style={{ position: 'absolute', top: 12, right: 12, opacity: hov ? 1 : 0, transition: 'opacity 0.2s', color: 'var(--primary)' }}><ArrowUpRight size={14} /></div>}

      {/* Admin actions (e.g. delete button) */}
      {adminActions && <div style={{ position: 'absolute', top: 12, right: 12 }}>{adminActions}</div>}

      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44, background: 'var(--paper2)', border: '1.25px solid var(--border)',
          borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', padding: 6, flexShrink: 0,
        }}>
          <CompanyLogo name={company.companyName} url={company.domain} size={44} borderRadius={10} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '1rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company.companyName}
          </h3>
          {company.openRoles > 0 && <Badge variant="primary">{company.openRoles} open role{company.openRoles > 1 ? 's' : ''}</Badge>}
        </div>
      </div>

      {/* Location */}
      <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--subtle-ink)', lineHeight: 1.5, marginTop: 'auto' }}>
        <MapPin size={12} style={{ flexShrink: 0 }} />
        {company.cities.length > 0 ? company.cities.slice(0, 3).join(', ') : 'India (Various)'}
      </p>

      {/* Source badge for admin */}
      {adminActions && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge variant={company.source === 'scraped' ? 'primary' : 'neutral'}>{company.source}</Badge>
        </div>
      )}
    </div>
  );
}
