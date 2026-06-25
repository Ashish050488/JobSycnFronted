// FILE: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/layouts/AppLayout';
import Home from './pages/seeker/Home';
import Today from './pages/seeker/Today';
import CompanyDirectory from './pages/seeker/CompanyDirectory';
import Dashboard from './pages/seeker/Dashboard';
import Progress from './pages/seeker/Progress';
import Legal from './pages/seeker/Legal';
import LoginScreen from './components/seeker/LoginScreen';
import Styleguide from './pages/Styleguide';
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
        <Route path="directory" element={currentUser ? <CompanyDirectory /> : <LoginScreen />} />
        <Route path="jobs" element={<Dashboard />} />
        <Route path="progress" element={currentUser ? <Progress /> : <LoginScreen />} />
        {/* Dev-only design-system gallery. Excluded from production builds. */}
        {import.meta.env.DEV && <Route path="styleguide" element={<Styleguide />} />}
      </Route>
      <Route path="login" element={<LoginScreen />} />
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