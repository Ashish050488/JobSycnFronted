// FILE: src/components/layouts/PublicLayout.tsx
// Minimal header + content + footer for public apply pages.
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { BRAND_SPLIT, COPY } from '../../theme/brand';
import { TYPE } from '../../theme/tokens';

export default function PublicLayout({
  companyName, children,
}: {
  /** Optional company name shown beside the brand logo. */
  companyName?: string;
  children?: ReactNode;
}) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <header
        style={{
          height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        }}
      >
        <span className="font-display" style={{ fontSize: TYPE.lg, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {BRAND_SPLIT.first}
          <span style={{ color: 'var(--accent)' }}>{BRAND_SPLIT.accent}</span>
        </span>
        {companyName && (
          <>
            <span aria-hidden style={{ color: 'var(--border-strong)' }}>/</span>
            <span style={{ fontSize: TYPE.base, fontWeight: 500, color: 'var(--ink-muted)' }}>{companyName}</span>
          </>
        )}
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children ?? <Outlet />}
      </main>

      <footer style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ fontSize: TYPE.xs, color: 'var(--ink-faint)', margin: 0 }}>{COPY.footer.disclaimer}</p>
      </footer>
    </div>
  );
}
