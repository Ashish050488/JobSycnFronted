// FILE: tests/pages/apply/Success.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ApplySuccess from '../../../src/pages/apply/Success';

function renderAt(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/apply/acme/react-dev/success', state }]}>
      <Routes><Route path="/apply/:companySlug/:jobSlug/success" element={<ApplySuccess />} /></Routes>
    </MemoryRouter>,
  );
}

describe('ApplySuccess page', () => {
  it('renders the job title + company from router state', () => {
    renderAt({ companyName: 'Acme', jobTitle: 'React Developer' });
    expect(screen.getByText('Application submitted')).toBeInTheDocument();
    expect(screen.getByText('You applied to React Developer at Acme.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View more positions at Acme/ })).toHaveAttribute('href', '/apply/acme');
  });

  it('falls back to a generic message when state is missing', () => {
    renderAt();
    expect(screen.getByText('Your application has been submitted.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View more positions' })).toHaveAttribute('href', '/apply/acme');
  });
});
