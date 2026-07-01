// FILE: src/components/employer/RequireEmployerOnboarded.tsx
// Second-stage employer guard. Sits inside RequireEmployerAuth: assumes the
// session check ran, then requires a company. A signed-in user without a
// company is sent to onboarding; everyone else reaches the protected outlet.
// Renders null while the initial /me check is in flight to avoid a redirect
// flash (R3).

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEmployer } from '../../context/employer/EmployerContext';

export default function RequireEmployerOnboarded() {
  const { employerUser, company, isLoading } = useEmployer();
  const location = useLocation();

  if (isLoading) return null;
  if (!employerUser) {
    return <Navigate to="/employer/login" state={{ from: location }} replace />;
  }
  if (!company) {
    return <Navigate to="/employer/onboarding" state={{ from: location }} replace />;
  }
  return <Outlet />;
}
