// FILE: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import Home from './pages/Home';
import Today from './pages/Today';
import CompanyDirectory from './pages/CompanyDirectory';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import Legal from './pages/Legal';
import LoginScreen from './components/LoginScreen';
import HiringLeaderboard from './pages/HiringLeaderboard';
import { useUser } from './context/UserContext';

function AppRoutes() {
  const { currentUser, isLoading } = useUser();
  if (isLoading) return null;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Guests see marketing landing at /. Logged-in users get redirected to /jobs. */}
        <Route index element={currentUser ? <Navigate to="/jobs" replace /> : <Home />} />
        <Route path="today" element={currentUser ? <Today /> : <LoginScreen />} />
        <Route path="legal" element={<Legal />} />
        <Route path="directory" element={currentUser ? <CompanyDirectory /> : <LoginScreen />} />
        <Route path="hiring" element={<HiringLeaderboard />} />
        <Route path="jobs" element={<Dashboard />} />
        <Route path="progress" element={currentUser ? <Progress /> : <LoginScreen />} />
      </Route>
      <Route path="login" element={<LoginScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}