import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { UserCtx, AppUser } from '../../../src/context/seeker/seeker-context-types';

let ctxValue: UserCtx;
vi.mock('../../../src/context/seeker/SeekerContext', () => ({
  useSeeker: () => ctxValue,
}));

import AdminAppLayout from '../../../src/components/layouts/AdminAppLayout';

const ADMIN_USER: AppUser = {
  name: 'Admin One', email: 'admin@jobmesh.in', picture: '', slug: 'admin-one',
};

// Minimal stub — the layout only reads currentUser, logout, isLoading.
const BASE = {
  currentUser: ADMIN_USER,
  isLoading: false,
  logout: () => {},
} as unknown as UserCtx;

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin/employer-access']}>
      <Routes>
        <Route path="/admin" element={<AdminAppLayout />}>
          <Route path="employer-access" element={<div>ACCESS PAGE</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  ctxValue = { ...BASE };
});

describe('AdminAppLayout', () => {
  it('renders the top nav around the routed outlet', () => {
    renderLayout();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Employer Access')).toBeInTheDocument();
    expect(screen.getByText('ACCESS PAGE')).toBeInTheDocument();
  });

  it('reads currentUser from context (avatar menu available)', () => {
    renderLayout();
    expect(screen.getByLabelText('Account menu')).toBeInTheDocument();
  });

  it('renders nothing when currentUser is null (defensive, no crash)', () => {
    ctxValue = { ...BASE, currentUser: null };
    renderLayout();
    expect(screen.queryByText('Employer Access')).toBeNull();
    expect(screen.queryByText('ACCESS PAGE')).toBeNull();
  });

  it('renders nothing while the session is loading', () => {
    ctxValue = { ...BASE, isLoading: true };
    renderLayout();
    expect(screen.queryByText('Employer Access')).toBeNull();
  });
});
