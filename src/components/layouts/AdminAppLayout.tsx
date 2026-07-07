// FILE: src/components/layouts/AdminAppLayout.tsx
// Admin route shell (STEP-N2). Wraps the RequireSeekerAdmin-guarded routes with
// a persistent top nav so admins navigate by UI instead of typing URLs and can
// sign out from the header. Layered INSIDE RequireSeekerAdmin (App.tsx) so the
// shell only mounts for authorised sessions (R3). Admin sessions are seeker
// sessions with a whitelisted email, so useSeeker() is the auth source (R4) —
// no separate admin context. Desktop-first: no footer, no mobile bottom nav.

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSeeker } from '../../context/seeker/SeekerContext';
import { useViewport } from '../../hooks/shared/useViewport';
import AdminTopNav from './parts/AdminTopNav';

// Route strings live once here (R5, D4). Future admin pages register their
// paths in this object before use; AdminTopNav imports it (same seam N1 uses).
export const ADMIN_ROUTES = {
  HOME: '/admin',
  EMPLOYER_ACCESS: '/admin/employer-access',
} as const;

const COMPACT_BREAKPOINT_WIDTH = 1024;

export default function AdminAppLayout() {
  const { currentUser, logout, isLoading } = useSeeker();
  const viewport = useViewport();
  const isCompact = viewport.w < COMPACT_BREAKPOINT_WIDTH;

  const location = useLocation();
  // Reset scroll on route change so a new page never paints mid-scroll (mirror seeker).
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  // Defensive: RequireSeekerAdmin guards above, but the layout can mount a tick
  // before context resolves. Render nothing rather than a half-populated nav.
  if (isLoading || !currentUser) return null;

  const navUser = {
    name: currentUser.name,
    email: currentUser.email,
    picture: currentUser.picture || undefined,
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)',
    }}>
      <AdminTopNav
        isCompact={isCompact}
        currentUser={navUser}
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
