import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { EmployerCtx } from '../../../src/context/employer/employer-context-types';

let ctxValue: EmployerCtx;
vi.mock('../../../src/context/employer/EmployerContext', () => ({
  useEmployer: () => ctxValue,
}));

import EmployerAppLayout from '../../../src/components/layouts/EmployerAppLayout';

const BASE: EmployerCtx = {
  employerUser: { id: 'e1', email: 'owner@acme.com', name: 'Owner One', picture: null, companyId: 'c1' },
  company: {
    id: 'c1', slug: 'acme', name: 'Acme', website: null, logoUrl: null,
    plan: 'free', retentionDays: 30, privacyPolicyUrl: null, dpoEmail: null, createdAt: '2026-01-01',
  },
  isLoading: false,
  isAuthenticating: false,
  loginError: null,
  login: async () => {},
  logout: async () => {},
  clearLoginError: () => {},
  refreshEmployerSession: async () => {},
};

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/employer']}>
      <Routes>
        <Route path="/employer" element={<EmployerAppLayout />}>
          <Route index element={<div>DASH PAGE</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  ctxValue = { ...BASE };
});

describe('EmployerAppLayout', () => {
  it('renders the top nav around the routed outlet', () => {
    renderLayout();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('DASH PAGE')).toBeInTheDocument();
  });

  it('reads employerUser + company from context (company name in nav)', () => {
    renderLayout();
    expect(screen.getByText('Hire · Acme')).toBeInTheDocument();
  });

  it('renders nothing when employerUser is null (defensive, no crash)', () => {
    ctxValue = { ...BASE, employerUser: null };
    renderLayout();
    expect(screen.queryByText('Dashboard')).toBeNull();
    expect(screen.queryByText('DASH PAGE')).toBeNull();
  });
});
