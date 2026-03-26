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

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="legal" element={<Legal />} />
        <Route path="directory" element={currentUser ? <CompanyDirectory /> : <LoginScreen />} />
        <Route path="jobs" element={currentUser ? <Dashboard /> : <LoginScreen />} />
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