// FILE: src/components/seeker/FilterBar.tsx
// Legacy lightweight filter dropdown. Kept for any older import paths.

import { useEffect, useState } from 'react';
import { COPY } from '../../theme/brand';

interface Props {
  selectedCompany: string;
  onCompanyChange: (c: string) => void;
  allCompanies: string[];
}

export default function FilterBar({ selectedCompany, onCompanyChange, allCompanies }: Props) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '10px 0',
    }}>
      <p style={{
        fontSize: '0.78rem', color: 'var(--ink-muted)',
        letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600,
      }}>{COPY.jobs.feedTitle}</p>
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>{COPY.jobs.filterLabel}:</span>
      <select
        value={selectedCompany}
        onChange={e => onCompanyChange(e.target.value)}
        style={{
          padding: isMobile ? '7px 10px' : '8px 12px',
          fontFamily: 'inherit', fontSize: '0.85rem',
          background: 'var(--surface)', color: 'var(--ink)',
          border: '1px solid var(--border-strong)', borderRadius: 9,
          cursor: 'pointer', outline: 'none',
        }}
      >
        <option value="">{COPY.jobs.allCompanies}</option>
        {allCompanies.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}
