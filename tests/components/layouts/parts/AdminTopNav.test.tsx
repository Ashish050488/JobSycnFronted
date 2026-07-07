import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

import AdminTopNav from '../../../../src/components/layouts/parts/AdminTopNav';

const USER = { name: 'Admin One', email: 'admin@jobmesh.in', picture: undefined };

function renderNav(pathname = '/admin/employer-access', overrides: Record<string, unknown> = {}) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AdminTopNav isCompact={false} currentUser={USER} onLogout={() => {}} {...overrides} />
    </MemoryRouter>,
  );
}

// Surfaces the current location so logo-click navigation can be asserted.
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="loc">{location.pathname}</div>;
}

describe('AdminTopNav', () => {
  it('renders the brand, the Admin badge, and the Employer Access link', () => {
    renderNav();
    expect(screen.getByLabelText('Go to admin home')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Employer Access')).toBeInTheDocument();
  });

  it('shows the Admin badge even at a compact viewport', () => {
    renderNav('/admin/employer-access', { isCompact: true });
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('highlights Employer Access on its route', () => {
    renderNav('/admin/employer-access');
    expect(screen.getByText('Employer Access').style.background).toBe('var(--paper-2)');
  });

  it('keeps Employer Access highlighted on a nested subpath via startsWith', () => {
    renderNav('/admin/employer-access/acme-co');
    expect(screen.getByText('Employer Access').style.background).toBe('var(--paper-2)');
  });

  it('logo links to the admin home route', () => {
    renderNav();
    expect(screen.getByLabelText('Go to admin home').getAttribute('href')).toBe('/admin');
  });

  it('logo click navigates to /admin', () => {
    render(
      <MemoryRouter initialEntries={['/admin/employer-access']}>
        <AdminTopNav isCompact={false} currentUser={USER} onLogout={() => {}} />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText('Go to admin home'));
    expect(screen.getByTestId('loc').textContent).toBe('/admin');
  });

  it('avatar falls back to the name initial when there is no picture', () => {
    renderNav('/admin/employer-access', { currentUser: { ...USER, picture: undefined } });
    const button = screen.getByLabelText('Account menu');
    expect(button.textContent).toBe('A');
    expect(button.querySelector('img')).toBeNull();
  });

  it('avatar button exposes menu a11y attributes and toggles aria-expanded', () => {
    renderNav();
    const button = screen.getByLabelText('Account menu');
    expect(button.getAttribute('aria-haspopup')).toBe('menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes the dropdown on Escape', () => {
    renderNav();
    fireEvent.click(screen.getByLabelText('Account menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes the dropdown on click outside', () => {
    renderNav();
    fireEvent.click(screen.getByLabelText('Account menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('dropdown shows name + email and Sign out calls onLogout', () => {
    const onLogout = vi.fn();
    renderNav('/admin/employer-access', { onLogout });
    fireEvent.click(screen.getByLabelText('Account menu'));
    expect(screen.getByText('Admin One')).toBeInTheDocument();
    expect(screen.getByText('admin@jobmesh.in')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sign out'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
