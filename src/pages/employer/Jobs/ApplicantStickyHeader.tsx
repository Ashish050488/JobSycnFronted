// FILE: src/pages/employer/Jobs/ApplicantStickyHeader.tsx
// Desktop-only sticky rail for the applicant detail page (P2.1, R4). Pins the
// back-CTA + candidate identity below the N1 employer top nav while the resume and
// score scroll beneath it. Pure presentational — no state, no data fetching; the
// parent owns backHref/backLabel (reusing the P1 ?from→?tab logic, R5).

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// N1's EmployerTopNav is a sticky header whose inner bar declares minHeight: 60 under
// the global `* { box-sizing: border-box }` reset (index.css:22), plus a 1px
// border-bottom — so its rendered height is 61px. This bar pins directly below it.
// Source: src/components/layouts/parts/EmployerTopNav.tsx:87 (minHeight) + :83 (border).
const NAV_HEIGHT_PIXELS = 61;

export default function ApplicantStickyHeader({
  backHref, backLabel, candidateName, candidateEmail,
}: {
  backHref: string;
  backLabel: string;
  candidateName: string;
  candidateEmail: string | null;
}) {
  return (
    <div
      style={{
        position: 'sticky',
        top: NAV_HEIGHT_PIXELS,
        zIndex: 20,
        background: 'var(--paper)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 20px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <Link
        to={backHref}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
          color: 'var(--ink-muted)', flexShrink: 0,
        }}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {backLabel}
      </Link>
      <div style={{ minWidth: 0, textAlign: 'right' }}>
        <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {candidateName}
        </div>
        {candidateEmail && (
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {candidateEmail}
          </div>
        )}
      </div>
    </div>
  );
}
