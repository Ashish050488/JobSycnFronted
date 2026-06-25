import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './theme/ThemeProvider';
import { SeekerProvider } from './context/seeker/SeekerContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <SeekerProvider>
          <App />
        </SeekerProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
