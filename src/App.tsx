// FILE: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/layouts/AppLayout';
import Home from './pages/seeker/Home';
import Today from './pages/seeker/Today';
import CompanyDirectory from './pages/seeker/CompanyDirectory';
import Dashboard from './pages/seeker/Dashboard';
import Progress from './pages/seeker/Progress';
import Legal from './pages/seeker/Legal';
import Privacy from './pages/public/Privacy';
import ConsentManager from './pages/seeker/ConsentManager';
import ResumeUpload from './pages/seeker/ResumeUpload';
import Profile from './pages/seeker/Profile';
import LoginScreen from './components/seeker/LoginScreen';
import Styleguide from './pages/Styleguide';
import EmployerLogin from './pages/employer/Login';
import EmployerDashboard from './pages/employer/Dashboard';
import EmployerOnboarding from './pages/employer/Onboarding';
import EmployerJobsList from './pages/employer/Jobs';
import EmployerJobsNew from './pages/employer/Jobs/New';
import EmployerJobsDetail from './pages/employer/Jobs/Detail';
import RequireEmployerAuth from './components/employer/RequireEmployerAuth';
import RequireEmployerOnboarded from './components/employer/RequireEmployerOnboarded';
import AdminEmployerAccess from './pages/admin/EmployerAccess';
import RequireSeekerAdmin from './components/admin/RequireSeekerAdmin';
import { ToastProvider } from './components/ui';
import { useSeeker } from './context/seeker/SeekerContext';

function AppRoutes() {
  const { currentUser, isLoading } = useSeeker();
  if (isLoading) return null;

  // Routing convention:
  //   - Seeker pages are at the URL root (/today, /dashboard, etc.). Seekers are the default audience on jobmesh.in.
  //   - Employer pages live under /employer/* (added in a later phase).
  //   - Public apply pages live under /apply/* (added in a later phase).
  //   - Backend API uses /api/seeker/*, /api/employer/*, /api/public/* prefixes regardless of frontend URL.
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        {/* Guests see marketing landing at /. Logged-in users get redirected to /jobs. */}
        <Route index element={currentUser ? <Navigate to="/jobs" replace /> : <Home />} />
        <Route path="today" element={currentUser ? <Today /> : <LoginScreen />} />
        <Route path="legal" element={<Legal />} />
        <Route path="legal/privacy" element={<Privacy />} />
        <Route path="account/privacy" element={currentUser ? <ConsentManager /> : <LoginScreen />} />
        <Route path="directory" element={currentUser ? <CompanyDirectory /> : <LoginScreen />} />
        <Route path="jobs" element={<Dashboard />} />
        <Route path="progress" element={currentUser ? <Progress /> : <LoginScreen />} />
        <Route path="resume" element={currentUser ? <ResumeUpload /> : <LoginScreen />} />
        <Route path="profile" element={currentUser ? <Profile /> : <LoginScreen />} />
        {/* Dev-only design-system gallery. Excluded from production builds. */}
        {import.meta.env.DEV && <Route path="styleguide" element={<Styleguide />} />}
      </Route>
      <Route path="login" element={<LoginScreen />} />
      {/* Employer audience — login is public; the dashboard is guarded. */}
      <Route path="employer/login" element={<EmployerLogin />} />
      <Route path="employer" element={<RequireEmployerAuth />}>
        <Route path="onboarding" element={<EmployerOnboarding />} />
        <Route element={<RequireEmployerOnboarded />}>
          <Route index element={<EmployerDashboard />} />
          <Route path="jobs" element={<EmployerJobsList />} />
          <Route path="jobs/new" element={<EmployerJobsNew />} />
          <Route path="jobs/:postingId" element={<EmployerJobsDetail />} />
        </Route>
      </Route>
      {/* Admin audience — seeker cookie required; admin-vs-not enforced by the API. */}
      <Route path="admin" element={<RequireSeekerAdmin />}>
        <Route path="employer-access" element={<AdminEmployerAccess />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}