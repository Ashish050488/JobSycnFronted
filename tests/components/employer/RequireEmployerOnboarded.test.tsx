// FILE: tests/components/employer/RequireEmployerOnboarded.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { EmployerCtx, EmployerCompany } from '../../../src/context/employer/employer-context-types';

let ctxValue: EmployerCtx;
vi.mock('../../../src/context/employer/EmployerContext', () => ({
  useEmployer: () => ctxValue,
}));

import RequireEmployerOnboarded from '../../../src/components/employer/RequireEmployerOnboarded';

const EMPLOYER = { id: 'e1', email: 'o@a.com', name: 'O', picture: null, companyId: 'c1' };
const COMPANY: EmployerCompany = {
  id: 'c1', slug: 'acme', name: 'Acme', website: null, logoUrl: null,
  plan: 'free', retentionDays: 365, privacyPolicyUrl: null, dpoEmail: null, createdAt: 't',
};

const BASE: EmployerCtx = {
  employerUser: null,
  company: null,
  isLoading: false,
  isAuthenticating: false,
  loginError: null,
  login: async () => {},
  logout: async () => {},
  clearLoginError: () => {},
  refreshEmployerSession: async () => {},
};

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/employer']}>
      <Routes>
        <Route path="/employer" element={<RequireEmployerOnboarded />}>
          <Route index element={<div>PROTECTED</div>} />
        </Route>
        <Route path="/employer/login" element={<div>LOGIN PAGE</div>} />
        <Route path="/employer/onboarding" element={<div>ONBOARDING PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => { ctxValue = { ...BASE }; });

describe('RequireEmployerOnboarded', () => {
  it('renders null while isLoading (no redirect, no children)', () => {
    ctxValue = { ...BASE, isLoading: true };
    renderGuard();
    expect(screen.queryByText('PROTECTED')).toBeNull();
    expect(screen.queryByText('ONBOARDING PAGE')).toBeNull();
    expect(screen.queryByText('LOGIN PAGE')).toBeNull();
  });

  it('redirects to /employer/login when no employerUser', () => {
    ctxValue = { ...BASE, employerUser: null };
    renderGuard();
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
  });

  it('redirects to /employer/onboarding when employerUser set but no company', () => {
    ctxValue = { ...BASE, employerUser: EMPLOYER, company: null };
    renderGuard();
    expect(screen.getByText('ONBOARDING PAGE')).toBeInTheDocument();
  });

  it('renders the protected outlet when both employerUser and company are set', () => {
    ctxValue = { ...BASE, employerUser: EMPLOYER, company: COMPANY };
    renderGuard();
    expect(screen.getByText('PROTECTED')).toBeInTheDocument();
  });
});
