// FILE: src/components/layouts/EmployerAppLayout.tsx
// Employer route shell (STEP-N1). Wraps the onboarded employer routes with a
// persistent top nav so employers navigate by tabs instead of typing URLs.
// Layered between RequireEmployerOnboarded and the leaf routes (App.tsx) so the
// onboarding route stays shell-free (D3, R2). Desktop-first: no footer, no
// mobile bottom nav (D1). The layout stays mounted across sibling routes (R1);
// only the outlet's keyed wrapper remounts per navigation.

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useEmployer } from '../../context/employer/EmployerContext';
import { useViewport } from '../../hooks/shared/useViewport';
import EmployerTopNav from './parts/EmployerTopNav';

// Route strings live once here (R5, D4). Future employer tabs (settings,
// applicants) register their paths in this object before use.
export const EMPLOYER_ROUTES = {
  DASHBOARD: '/employer',
  JOBS: '/employer/jobs',
} as const;

const COMPACT_BREAKPOINT_WIDTH = 1024;

export default function EmployerAppLayout() {
  const { employerUser, company, logout } = useEmployer();
  const viewport = useViewport();
  const isCompact = viewport.w < COMPACT_BREAKPOINT_WIDTH;

  const location = useLocation();
  // Reset scroll on route change so a new page never paints mid-scroll (mirror seeker).
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  // Defensive: RequireEmployerAuth guards above, but the layout can mount a tick
  // before context resolves. Render nothing rather than a half-populated nav.
  if (!employerUser) return null;

  const currentUser = {
    name: employerUser.name,
    email: employerUser.email,
    picture: employerUser.picture ?? undefined,
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)',
    }}>
      <EmployerTopNav
        isCompact={isCompact}
        currentUser={currentUser}
        companyName={company?.name ?? null}
        onLogout={logout}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* key by path forces a clean unmount/remount per route (mirror seeker). */}
        <div key={location.pathname} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
