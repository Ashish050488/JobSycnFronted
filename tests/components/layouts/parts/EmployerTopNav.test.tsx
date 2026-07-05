import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import EmployerTopNav from '../../../../src/components/layouts/parts/EmployerTopNav';

const USER = { name: 'Owner One', email: 'owner@acme.com', picture: undefined };

function renderNav(pathname = '/employer', overrides: Record<string, unknown> = {}) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <EmployerTopNav isCompact={false} currentUser={USER} companyName="Acme" onLogout={() => {}} {...overrides} />
    </MemoryRouter>,
  );
}

describe('EmployerTopNav', () => {
  it('renders the brand logo plus Dashboard and Jobs links', () => {
    renderNav();
    expect(screen.getByLabelText('Go to dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
  });

  it('shows the company name when not compact', () => {
    renderNav();
    expect(screen.getByText('Hire · Acme')).toBeInTheDocument();
  });

  it('highlights Dashboard on /employer', () => {
    renderNav('/employer');
    expect(screen.getByText('Dashboard').style.background).toBe('var(--paper-2)');
    expect(screen.getByText('Jobs').style.background).toBe('transparent');
  });

  it('highlights Jobs on /employer/jobs', () => {
    renderNav('/employer/jobs');
    expect(screen.getByText('Jobs').style.background).toBe('var(--paper-2)');
    expect(screen.getByText('Dashboard').style.background).toBe('transparent');
  });

  it('highlights Jobs on a nested detail path via startsWith', () => {
    renderNav('/employer/jobs/abc-123');
    expect(screen.getByText('Jobs').style.background).toBe('var(--paper-2)');
    expect(screen.getByText('Dashboard').style.background).toBe('transparent');
  });

  it('logo links to the dashboard route', () => {
    renderNav();
    expect(screen.getByLabelText('Go to dashboard').getAttribute('href')).toBe('/employer');
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
    renderNav('/employer', { onLogout });
    fireEvent.click(screen.getByLabelText('Account menu'));
    expect(screen.getByText('Owner One')).toBeInTheDocument();
    expect(screen.getByText('owner@acme.com')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Sign out'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
