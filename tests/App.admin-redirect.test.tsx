import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { UserCtx, AppUser } from '../src/context/seeker/seeker-context-types';

const ADMIN_USER: AppUser = {
  name: 'Admin One', email: 'admin@jobmesh.in', picture: '', slug: 'admin-one',
};

const ctxValue = {
  currentUser: ADMIN_USER, isLoading: false, logout: () => {},
} as unknown as UserCtx;

vi.mock('../src/context/seeker/SeekerContext', () => ({
  useSeeker: () => ctxValue,
}));

// Stub the landing page so the redirect target is unambiguous and no network runs.
vi.mock('../src/pages/admin/EmployerAccess', () => ({
  default: () => <div>EMPLOYER ACCESS PAGE</div>,
}));

import { AppRoutes } from '../src/App';

describe('admin index redirect', () => {
  it('redirects bare /admin to /admin/employer-access', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    // Landing on the stub proves the index <Navigate/> resolved through the shell.
    expect(screen.getByText('EMPLOYER ACCESS PAGE')).toBeInTheDocument();
    // The admin shell mounted around it.
    expect(screen.getByText('Employer Access')).toBeInTheDocument();
  });
});
