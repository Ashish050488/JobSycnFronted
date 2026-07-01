// FILE: src/components/admin/RequireSeekerAdmin.tsx
// Route guard for /admin/*. Only checks that a seeker is logged in — the
// admin-vs-not decision is made server-side (the API returns 403, which the
// page surfaces per R6). Renders null while the session check is in flight.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSeeker } from '../../context/seeker/SeekerContext';

export default function RequireSeekerAdmin() {
  const { currentUser, isLoading } = useSeeker();
  const location = useLocation();

  if (isLoading) return null;
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
