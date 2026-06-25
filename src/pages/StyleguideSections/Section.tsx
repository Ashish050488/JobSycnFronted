// FILE: src/pages/StyleguideSections/Section.tsx
// Shared layout helpers for the dev styleguide.
import type { ReactNode } from 'react';
import { TYPE } from '../../theme/tokens';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ paddingTop: 32, borderTop: '1px solid var(--border)' }}>
      <h2 style={{ fontSize: TYPE.xl, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </section>
  );
}

export function Row({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div>
      {label && <p style={{ fontSize: TYPE.xs, color: 'var(--ink-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{children}</div>
    </div>
  );
}

export function Stack({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div>
      {label && <p style={{ fontSize: TYPE.xs, color: 'var(--ink-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>{children}</div>
    </div>
  );
}
