// FILE: src/components/employer/RequireEmployerAuth.tsx
// Route guard for /employer/*. Renders null while the initial session check is
// in flight (avoids a flash-of-redirect), redirects unauthenticated visitors to
// the login page, and captures the attempted location so login can return them.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEmployer } from '../../context/employer/EmployerContext';

export default function RequireEmployerAuth() {
  const { employerUser, isLoading } = useEmployer();
  const location = useLocation();

  if (isLoading) return null;
  if (!employerUser) {
    return <Navigate to="/employer/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
