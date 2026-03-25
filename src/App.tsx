// FILE: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import Home from './pages/Home';
import CompanyDirectory from './pages/CompanyDirectory';
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import Legal from './pages/Legal';
import LoginScreen from './components/LoginScreen';
import { useUser } from './context/UserContext';

function AppRoutes() {
  const { currentUser, isLoading } = useUser();

  if (isLoading) return null;
  if (!currentUser) return <LoginScreen />;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="directory" element={<CompanyDirectory />} />
        <Route path="jobs" element={<Dashboard />} />
        <Route path="progress" element={<Progress />} />
        <Route path="legal" element={<Legal />} />
      </Route>
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
