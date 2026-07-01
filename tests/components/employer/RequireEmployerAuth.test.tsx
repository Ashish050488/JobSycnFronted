// FILE: tests/components/employer/RequireEmployerAuth.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { EmployerCtx } from '../../../src/context/employer/employer-context-types';

let ctxValue: EmployerCtx;
vi.mock('../../../src/context/employer/EmployerContext', () => ({
  useEmployer: () => ctxValue,
}));

import RequireEmployerAuth from '../../../src/components/employer/RequireEmployerAuth';

const BASE: EmployerCtx = {
  employerUser: null,
  isLoading: false,
  isAuthenticating: false,
  loginError: null,
  login: async () => {},
  logout: async () => {},
  clearLoginError: () => {},
};

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/employer']}>
      <Routes>
        <Route path="/employer" element={<RequireEmployerAuth />}>
          <Route index element={<div>PROTECTED</div>} />
        </Route>
        <Route path="/employer/login" element={<div>LOGIN PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  ctxValue = { ...BASE };
});

describe('RequireEmployerAuth', () => {
  it('renders null while isLoading (no redirect, no children)', () => {
    ctxValue = { ...BASE, isLoading: true };
    renderGuard();
    expect(screen.queryByText('PROTECTED')).toBeNull();
    expect(screen.queryByText('LOGIN PAGE')).toBeNull();
  });

  it('redirects to /employer/login when no employerUser', () => {
    ctxValue = { ...BASE, employerUser: null };
    renderGuard();
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED')).toBeNull();
  });

  it('renders the protected outlet when employerUser is set', () => {
    ctxValue = {
      ...BASE,
      employerUser: { id: 'e1', email: 'o@a.com', name: 'O', picture: null, companyId: null },
    };
    renderGuard();
    expect(screen.getByText('PROTECTED')).toBeInTheDocument();
  });
});
