// FILE: src/context/employer/EmployerContext.tsx
// Thin wrapper around useEmployerAuth. Future steps compose company /
// postings / applications hooks here, mirroring SeekerContext's style.

import { createContext, useContext, type ReactNode } from 'react';
import { useEmployerAuth } from '../../hooks/employer/useEmployerAuth';
import type { EmployerCtx } from './employer-context-types';

const Ctx = createContext<EmployerCtx>({
  employerUser: null,
  company: null,
  isLoading: true,
  isAuthenticating: false,
  loginError: null,
  login: async () => {},
  logout: async () => {},
  clearLoginError: () => {},
  refreshEmployerSession: async () => {},
});

export function EmployerProvider({ children }: { children: ReactNode }) {
  const {
    employerUser, company, isLoading, isAuthenticating, loginError,
    login, logout, clearLoginError, refreshEmployerSession,
  } = useEmployerAuth();

  return (
    <Ctx.Provider value={{
      employerUser, company, isLoading, isAuthenticating, loginError,
      login, logout, clearLoginError, refreshEmployerSession,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useEmployer = () => useContext(Ctx);
