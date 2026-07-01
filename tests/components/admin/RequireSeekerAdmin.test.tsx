// FILE: tests/components/admin/RequireSeekerAdmin.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

let seekerValue: { currentUser: { email: string } | null; isLoading: boolean };
vi.mock('../../../src/context/seeker/SeekerContext', () => ({
  useSeeker: () => seekerValue,
}));

import RequireSeekerAdmin from '../../../src/components/admin/RequireSeekerAdmin';

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/admin/employer-access']}>
      <Routes>
        <Route path="/admin" element={<RequireSeekerAdmin />}>
          <Route path="employer-access" element={<div>PROTECTED</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  seekerValue = { currentUser: null, isLoading: false };
});

describe('RequireSeekerAdmin', () => {
  it('renders null while seeker isLoading', () => {
    seekerValue = { currentUser: null, isLoading: true };
    renderGuard();
    expect(screen.queryByText('PROTECTED')).toBeNull();
    expect(screen.queryByText('LOGIN')).toBeNull();
  });

  it('redirects to /login when currentUser is null', () => {
    seekerValue = { currentUser: null, isLoading: false };
    renderGuard();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED')).toBeNull();
  });

  it('renders the outlet when currentUser is set', () => {
    seekerValue = { currentUser: { email: 'admin@jobmesh.in' }, isLoading: false };
    renderGuard();
    expect(screen.getByText('PROTECTED')).toBeInTheDocument();
  });
});
