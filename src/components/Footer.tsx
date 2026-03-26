// FILE: src/components/Footer.tsx
import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { BRAND, BRAND_SPLIT, COPY } from '../theme/brand';
import { Divider } from './ui';

export default function Footer() {
  const year = new Date().getFullYear();
  const col = (title: string, links: [string, string][]) => (
    <div>
      <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 14 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(([to, label]) => (
          <Link key={to + label} to={to} style={{ fontSize: '0.875rem', color: 'var(--muted-ink)', textDecoration: 'none', transition: 'color 0.22s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-ink)')}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <footer style={{ background: 'var(--surface-solid)', borderTop: '1.25px solid var(--border)', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 40, marginBottom: 48 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--primary-soft)', border: '1.25px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={13} color="var(--primary)" />
              </div>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)' }}>
                {BRAND_SPLIT.first}<span className="font-sketch" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{BRAND_SPLIT.accent}</span>
              </span>
            </Link>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-ink)', lineHeight: 1.7, maxWidth: 300 }}>
              {BRAND.description}
            </p>
          </div>
          {col(COPY.footer.navigateTitle, [['/', COPY.footer.jobFeedLink], ['/directory', COPY.footer.companiesLink]])}
          {col(COPY.footer.legalTitle, [['/legal', COPY.footer.legalInfoLink], ['/legal', COPY.footer.privacyLink], ['/legal', COPY.footer.contactLink]])}
        </div>
        <Divider style={{ marginBottom: 20 }} />
        <p style={{ fontSize: '0.78rem', color: 'var(--subtle-ink)', textAlign: 'center', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 8px' }}>
          {COPY.footer.disclaimer}
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--subtle-ink)', opacity: 0.5 }}>
          &copy; {year} {BRAND.fullName}
        </p>
      </div>
    </footer>
  );
}