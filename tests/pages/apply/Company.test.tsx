// FILE: tests/pages/apply/Company.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { fetchPublicCompany, PublicApiError } = vi.hoisted(() => {
  class PublicApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { fetchPublicCompany: vi.fn(), PublicApiError };
});
vi.mock('../../../src/api/public-api', () => ({ fetchPublicCompany, PublicApiError }));

import ApplyCompany from '../../../src/pages/apply/Company';

function renderAt(slug = 'acme') {
  return render(
    <MemoryRouter initialEntries={[`/apply/${slug}`]}>
      <Routes><Route path="/apply/:companySlug" element={<ApplyCompany />} /></Routes>
    </MemoryRouter>,
  );
}
const JOBS = [{ id: 'j1', slug: 'react-dev', title: 'React Developer', location: 'Bengaluru', employmentType: 'full-time' }];

beforeEach(() => vi.clearAllMocks());

describe('ApplyCompany page', () => {
  it('shows a loading skeleton while fetching', () => {
    fetchPublicCompany.mockReturnValue(new Promise(() => {}));
    const { container } = renderAt();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('renders the company name and job list', async () => {
    fetchPublicCompany.mockResolvedValue({ company: { name: 'Acme', slug: 'acme', website: 'https://acme.com', logoUrl: null }, jobs: JOBS });
    renderAt();
    expect(await screen.findByRole('heading', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByText('React Developer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /React Developer/ })).toHaveAttribute('href', '/apply/acme/react-dev');
  });

  it('shows "Company not found" on 404', async () => {
    fetchPublicCompany.mockRejectedValue(new PublicApiError(404, 'COMPANY_NOT_FOUND', 'nope'));
    renderAt();
    expect(await screen.findByText(/Company not found/i)).toBeInTheDocument();
  });

  it('shows "No open positions" when there are no jobs', async () => {
    fetchPublicCompany.mockResolvedValue({ company: { name: 'Acme', slug: 'acme', website: null, logoUrl: null }, jobs: [] });
    renderAt();
    expect(await screen.findByText('No open positions')).toBeInTheDocument();
  });
});
