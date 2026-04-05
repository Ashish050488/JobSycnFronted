import { useMemo, useState, type ReactNode } from 'react';
import { MapPin, ArrowUpRight, Sparkles } from 'lucide-react';
import { Badge } from './ui';
import type { ICompany } from '../types';
import CompanyLogo from './CompanyLogo';

interface Props {
  company: ICompany;
  adminActions?: ReactNode;
}

function normalizeDomain(domain: string | undefined) {
  const raw = (domain || '').trim();
  if (!raw) return '';
  return raw.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export default function DirectoryCardModern({ company, adminActions }: Props) {
  const [hovered, setHovered] = useState(false);
  const safeDomain = useMemo(() => normalizeDomain(company.domain), [company.domain]);
  const cityText = company.cities.length > 0 ? company.cities.slice(0, 3).join(', ') : 'India (Multiple locations)';
  const extraCities = Math.max(company.cities.length - 3, 0);

  const visit = () => {
    if (adminActions || !safeDomain) return;
    window.open(`https://${safeDomain}`, '_blank');
  };

  return (
    <div
      className="sketch-card"
      onClick={visit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role={adminActions || !safeDomain ? undefined : 'link'}
      tabIndex={safeDomain && !adminActions ? 0 : -1}
      onKeyDown={e => {
        if (!adminActions && safeDomain && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          visit();
        }
      }}
      style={{
        background: hovered ? 'color-mix(in srgb, var(--primary-soft) 28%, var(--surface-solid))' : 'var(--surface-solid)',
        borderColor: hovered ? 'var(--border-strong)' : undefined,
        padding: '18px',
        cursor: adminActions || !safeDomain ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'all 0.22s ease',
        transform: hovered && !adminActions ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 18px 34px rgba(15, 23, 42, 0.08)' : 'none',
        minHeight: 184,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!adminActions && hovered && (
        <div
          style={{
            position: 'absolute',
            inset: 'auto -18px -24px auto',
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: 'var(--primary-soft)',
            filter: 'blur(22px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {adminActions ? (
        <div style={{ position: 'absolute', top: 14, right: 14 }}>{adminActions}</div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: hovered ? 'rgba(255,255,255,0.75)' : 'color-mix(in srgb, var(--paper2) 80%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: hovered ? 'var(--primary)' : 'var(--subtle-ink)',
            transition: 'all 0.18s ease',
          }}
        >
          <ArrowUpRight size={15} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', minWidth: 0 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--paper2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 7,
            flexShrink: 0,
          }}
        >
          <CompanyLogo name={company.companyName} url={company.domain} size={52} borderRadius={12} />
        </div>

        <div style={{ minWidth: 0, flex: 1, paddingRight: adminActions ? 40 : 48 }}>
          <h3
            style={{
              fontWeight: 800,
              color: 'var(--ink)',
              fontSize: '1rem',
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {company.companyName}
          </h3>
          {safeDomain && (
            <p style={{ fontSize: '0.78rem', color: 'var(--subtle-ink)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {safeDomain}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {company.openRoles > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 999,
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
              fontSize: '0.76rem',
              fontWeight: 800,
              border: '1px solid color-mix(in srgb, var(--primary) 35%, var(--border))',
            }}
          >
            <Sparkles size={12} />
            {company.openRoles} open role{company.openRoles > 1 ? 's' : ''}
          </span>
        )}
        {company.cities.length > 0 && <Badge variant="neutral">{company.cities.length} cities</Badge>}
        {adminActions && <Badge variant={company.source === 'scraped' ? 'primary' : 'neutral'}>{company.source}</Badge>}
      </div>

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          display: 'grid',
          gap: 8,
          minWidth: 0,
        }}
      >
        <p style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.84rem', color: 'var(--muted-ink)', lineHeight: 1.55, minWidth: 0 }}>
          <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ overflowWrap: 'anywhere' }}>
            {cityText}
            {extraCities > 0 ? ` +${extraCities} more` : ''}
          </span>
        </p>
        {!adminActions && (
          <p style={{ fontSize: '0.75rem', color: hovered ? 'var(--primary)' : 'var(--subtle-ink)', transition: 'color 0.18s ease' }}>
            Open company site and inspect active hiring signals
          </p>
        )}
      </div>
    </div>
  );
}
