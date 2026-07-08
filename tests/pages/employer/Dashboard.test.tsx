// FILE: tests/pages/employer/Dashboard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { EmployerCtx, EmployerCompany } from '../../../src/context/employer/employer-context-types';
import { ToastProvider } from '../../../src/components/ui';

let ctxValue: EmployerCtx;
vi.mock('../../../src/context/employer/EmployerContext', () => ({ useEmployer: () => ctxValue }));

import EmployerDashboard from '../../../src/pages/employer/Dashboard';

const COMPANY: EmployerCompany = {
  id: 'c1', slug: 'acme', name: 'Acme Agency', website: null, logoUrl: null,
  plan: 'free', retentionDays: 365, privacyPolicyUrl: null, dpoEmail: null, createdAt: 't',
};

const BASE: EmployerCtx = {
  employerUser: { id: 'e1', email: 'o@a.com', name: 'O', picture: null, companyId: 'c1' },
  company: COMPANY,
  isLoading: false, isAuthenticating: false, loginError: null,
  login: async () => {}, logout: vi.fn(async () => {}), clearLoginError: () => {},
  refreshEmployerSession: vi.fn(async () => {}),
};

const writeText = vi.fn().mockResolvedValue(undefined);

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ToastProvider><EmployerDashboard /></ToastProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  ctxValue = { ...BASE, logout: vi.fn(async () => {}), refreshEmployerSession: vi.fn(async () => {}) };
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

describe('EmployerDashboard', () => {
  it('renders the company name, slug and apply URL', () => {
    renderDashboard();
    expect(screen.getByText('Acme Agency')).toBeInTheDocument();
    expect(screen.getByText('acme')).toBeInTheDocument();
    expect(screen.getByText(/\/apply\/acme$/)).toBeInTheDocument();
  });

  it('copies the apply URL and shows a success toast', async () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(screen.getByText('Apply URL copied to clipboard.')).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/apply/acme`);
  });

  it('renders a warning alert with a retry when company is null', () => {
    ctxValue = { ...ctxValue, company: null };
    renderDashboard();
    expect(screen.getByText(/loading company/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(ctxValue.refreshEmployerSession).toHaveBeenCalledTimes(1);
  });

  it('does NOT render the stale "Steps 4–7" placeholder copy (P1.1 regression guard)', () => {
    renderDashboard();
    expect(screen.queryByText(/Steps 4/)).toBeNull();
    expect(screen.queryByText(/land in Steps/i)).toBeNull();
  });

  it('sign-out triggers logout', () => {
    renderDashboard();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(ctxValue.logout).toHaveBeenCalledTimes(1);
  });
});
