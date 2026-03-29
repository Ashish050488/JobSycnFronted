// FILE: src/components/Footer.tsx
import { Link } from 'react-router-dom';
import { BRAND, COPY } from '../theme/brand';
import BrandLogo from './BrandLogo';

export default function Footer() {
  const year = new Date().getFullYear();
  const col = (title: string, links: [string, string][]) => (
    <div>
      <p className="font-sketch" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 10 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(([to, label]) => (
          <Link key={to + label} to={to} style={{ fontSize: '0.82rem', color: 'var(--muted-ink)', textDecoration: 'none', transition: 'color 0.22s' }}
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
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(20px, 4vw, 36px)', marginBottom: 20 }}>
          <div style={{ flex: '1 1 280px', minWidth: 0, maxWidth: 320 }}>
            <Link to="/" style={{ textDecoration: 'none', marginBottom: 10, display: 'inline-block' }}>
              <BrandLogo size="sm" />
            </Link>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', lineHeight: 1.6, maxWidth: 260 }}>
              {BRAND.description}
            </p>
          </div>
          {col(COPY.footer.navigateTitle, [['/', COPY.footer.jobFeedLink], ['/directory', COPY.footer.companiesLink]])}
          {col(COPY.footer.legalTitle, [['/legal', COPY.footer.legalInfoLink], ['/legal', COPY.footer.privacyLink], ['/legal', COPY.footer.contactLink]])}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontSize: '0.73rem', color: 'var(--subtle-ink)', textAlign: 'center', lineHeight: 1.5 }}>
            {COPY.footer.disclaimer} · © {year} {BRAND.fullName}
          </p>
        </div>
      </div>
    </footer>
  );
}