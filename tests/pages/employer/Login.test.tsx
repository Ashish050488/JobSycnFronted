// FILE: tests/pages/employer/Login.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { EmployerCtx } from '../../../src/context/employer/employer-context-types';

vi.mock('@react-oauth/google', () => ({
  googleLogout: vi.fn(),
  GoogleLogin: (props: { onSuccess: (r: { credential: string }) => void; onError: () => void }) => (
    <button data-testid="google-login" onClick={() => props.onSuccess({ credential: 'tok' })}>
      Sign in with Google
    </button>
  ),
}));

let ctxValue: EmployerCtx;
vi.mock('../../../src/context/employer/EmployerContext', () => ({
  useEmployer: () => ctxValue,
}));

import EmployerLogin from '../../../src/pages/employer/Login';

const BASE: EmployerCtx = {
  employerUser: null,
  isLoading: false,
  isAuthenticating: false,
  loginError: null,
  login: vi.fn(),
  logout: vi.fn(),
  clearLoginError: vi.fn(),
};

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/employer/login']}>
      <Routes>
        <Route path="/employer/login" element={<EmployerLogin />} />
        <Route path="/employer" element={<div>DASHBOARD</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

/** Walk up from the message text to the first ancestor carrying a background. */
function alertBackground(message: string) {
  let element: HTMLElement | null = screen.getByText(message);
  while (element && !element.style.background) element = element.parentElement;
  return element?.style.background ?? '';
}

beforeEach(() => {
  ctxValue = { ...BASE, login: vi.fn(), clearLoginError: vi.fn() };
});

describe('EmployerLogin', () => {
  it('renders the Google sign-in button', () => {
    renderLogin();
    expect(screen.getByTestId('google-login')).toBeInTheDocument();
  });

  it('shows a danger alert when loginError.kind is gated', () => {
    ctxValue = { ...ctxValue, loginError: { kind: 'gated', message: 'Gated message' } };
    renderLogin();
    expect(alertBackground('Gated message')).toContain('danger');
  });

  it('shows a warning alert when loginError.kind is invalid', () => {
    ctxValue = { ...ctxValue, loginError: { kind: 'invalid', message: 'Invalid login' } };
    renderLogin();
    expect(alertBackground('Invalid login')).toContain('warning');
  });

  it('dismiss button clears the error', () => {
    const clearLoginError = vi.fn();
    ctxValue = { ...ctxValue, loginError: { kind: 'network', message: 'Net down' }, clearLoginError };
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss error' }));
    expect(clearLoginError).toHaveBeenCalledTimes(1);
  });

  it('navigates to /employer when employerUser is set on mount', () => {
    ctxValue = {
      ...ctxValue,
      employerUser: { id: 'e1', email: 'o@a.com', name: 'O', picture: null, companyId: null },
    };
    renderLogin();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
  });
});
