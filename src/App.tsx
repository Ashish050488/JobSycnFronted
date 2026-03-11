// FILE: src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import Home from './pages/Home';
import CompanyDirectory from './pages/CompanyDirectory';
import Dashboard from './pages/Dashboard';
import Legal from './pages/Legal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="directory" element={<CompanyDirectory />} />
          <Route path="jobs" element={<Dashboard />} />
          <Route path="legal" element={<Legal />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
