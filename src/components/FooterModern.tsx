import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { BRAND, COPY } from '../theme/brand';
import BrandLogo from './BrandLogo';

const linkStyle: CSSProperties = {
  fontSize: '0.84rem',
  color: 'var(--muted-ink)',
  textDecoration: 'none',
  lineHeight: 1.5,
};

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 18,
        border: '1px solid var(--border)',
        background: 'color-mix(in srgb, var(--paper2) 74%, transparent)',
      }}
    >
      <p className="font-sketch" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 10 }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {links.map(([to, label]) => (
          <Link key={`${to}-${label}`} to={to} style={linkStyle}>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function FooterModern() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--surface-solid) 92%, transparent), var(--surface-solid))',
        borderTop: '1px solid var(--border)',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 18px' }}>
        <div className="footer-grid" style={{ display: 'grid', gap: 'clamp(12px, 2vw, 20px)' }}>
          <div
            style={{
              padding: '20px',
              borderRadius: 22,
              border: '1px solid var(--border)',
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary-soft) 46%, transparent), color-mix(in srgb, var(--surface-solid) 84%, transparent))',
              minWidth: 0,
            }}
          >
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', marginBottom: 14 }}>
              <BrandLogo size="sm" />
            </Link>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted-ink)', lineHeight: 1.7, maxWidth: 420 }}>
              {BRAND.description}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              <span style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>
                Direct apply links
              </span>
              <span style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--subtle-ink)' }}>
                Built for mobile too
              </span>
            </div>
          </div>

          <FooterColumn title={COPY.footer.navigateTitle} links={[['/', COPY.footer.jobFeedLink], ['/directory', COPY.footer.companiesLink], ['/progress', COPY.nav.myProgress]]} />
          <FooterColumn title={COPY.footer.legalTitle} links={[['/legal', COPY.footer.legalInfoLink], ['/legal', COPY.footer.privacyLink], ['/legal', COPY.footer.contactLink]]} />
        </div>

        <div className="footer-meta" style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: '0.76rem', color: 'var(--subtle-ink)', lineHeight: 1.6, minWidth: 0 }}>
            {COPY.footer.disclaimer} · © {year} {BRAND.fullName}
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/legal" style={linkStyle}>Privacy</Link>
            <Link to="/legal" style={linkStyle}>Terms</Link>
            <Link to="/legal" style={linkStyle}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
