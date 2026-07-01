// FILE: tests/pages/employer/Onboarding.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { EmployerCtx, EmployerCompany } from '../../../src/context/employer/employer-context-types';

const { createEmployerCompany, EmployerApiError } = vi.hoisted(() => {
  class EmployerApiError extends Error {
    status: number;
    code: string | null;
    constructor(status: number, code: string | null, message: string) {
      super(message);
      this.name = 'EmployerApiError';
      this.status = status;
      this.code = code;
    }
  }
  return { createEmployerCompany: vi.fn(), EmployerApiError };
});

vi.mock('../../../src/api/employer-api', () => ({ createEmployerCompany, EmployerApiError }));

let ctxValue: EmployerCtx;
vi.mock('../../../src/context/employer/EmployerContext', () => ({ useEmployer: () => ctxValue }));

import EmployerOnboarding from '../../../src/pages/employer/Onboarding';

const EMPLOYER = { id: 'e1', email: 'o@a.com', name: 'O', picture: null, companyId: null };
const COMPANY: EmployerCompany = {
  id: 'c1', slug: 'acme', name: 'Acme', website: null, logoUrl: null,
  plan: 'free', retentionDays: 365, privacyPolicyUrl: null, dpoEmail: null, createdAt: 't',
};

const BASE: EmployerCtx = {
  employerUser: EMPLOYER, company: null,
  isLoading: false, isAuthenticating: false, loginError: null,
  login: async () => {}, logout: async () => {}, clearLoginError: () => {},
  refreshEmployerSession: vi.fn(async () => {}),
};

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={['/employer/onboarding']}>
      <Routes>
        <Route path="/employer/onboarding" element={<EmployerOnboarding />} />
        <Route path="/employer" element={<div>DASHBOARD</div>} />
        <Route path="/employer/login" element={<div>LOGIN PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  ctxValue = { ...BASE, refreshEmployerSession: vi.fn(async () => {}) };
  createEmployerCompany.mockReset();
});

function typeName(value: string) {
  fireEvent.change(screen.getByLabelText(/company name/i), { target: { value } });
}

describe('EmployerOnboarding', () => {
  it('redirects to /employer when a company already exists', () => {
    ctxValue = { ...ctxValue, company: COMPANY };
    renderOnboarding();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
  });

  it('redirects to /employer/login when there is no employerUser', () => {
    ctxValue = { ...ctxValue, employerUser: null };
    renderOnboarding();
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
  });

  it('disables submit and skips the API when name is empty', () => {
    renderOnboarding();
    const button = screen.getByRole('button', { name: 'Create company' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(createEmployerCompany).not.toHaveBeenCalled();
  });

  it('shows a field error and skips the API for an invalid website', () => {
    renderOnboarding();
    typeName('Acme Agency');
    fireEvent.change(screen.getByLabelText(/website/i), { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create company' }));
    expect(screen.getByText(/valid http/i)).toBeInTheDocument();
    expect(createEmployerCompany).not.toHaveBeenCalled();
  });

  it('shows a field error and skips the API for an out-of-range retention', () => {
    renderOnboarding();
    typeName('Acme Agency');
    fireEvent.change(screen.getByLabelText(/resume retention/i), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create company' }));
    expect(screen.getByText(/between 30 and 3650/i)).toBeInTheDocument();
    expect(createEmployerCompany).not.toHaveBeenCalled();
  });

  it('updates the apply-URL preview as the name is typed', () => {
    renderOnboarding();
    typeName('Acme Agency');
    expect(screen.getByText('/apply/acme-agency')).toBeInTheDocument();
  });

  it('happy path: posts, refreshes the session, and navigates to the dashboard', async () => {
    createEmployerCompany.mockResolvedValue(COMPANY);
    renderOnboarding();
    typeName('Acme Agency');
    fireEvent.click(screen.getByRole('button', { name: 'Create company' }));
    await waitFor(() => expect(screen.getByText('DASHBOARD')).toBeInTheDocument());
    expect(createEmployerCompany).toHaveBeenCalledWith({ name: 'Acme Agency', website: undefined, retentionDays: 365 });
    expect(ctxValue.refreshEmployerSession).toHaveBeenCalledTimes(1);
  });

  it('maps a server INVALID_NAME to the name field error', async () => {
    createEmployerCompany.mockRejectedValue(new EmployerApiError(400, 'INVALID_NAME', 'Server rejected the name'));
    renderOnboarding();
    typeName('Acme');
    fireEvent.click(screen.getByRole('button', { name: 'Create company' }));
    await waitFor(() => expect(screen.getByText('Server rejected the name')).toBeInTheDocument());
  });

  it('shows a top-level alert on ALREADY_ONBOARDED', async () => {
    createEmployerCompany.mockRejectedValue(new EmployerApiError(409, 'ALREADY_ONBOARDED', 'dup'));
    renderOnboarding();
    typeName('Acme Agency');
    fireEvent.click(screen.getByRole('button', { name: 'Create company' }));
    await waitFor(() => expect(screen.getByText(/already has a company/i)).toBeInTheDocument());
  });
});
