// FILE: tests/pages/employer/JobsList.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { Posting, PostingStatus } from '../../../src/types/employer-jobs';

const { listEmployerPostings, EmployerJobsApiError } = vi.hoisted(() => {
  class EmployerJobsApiError extends Error {
    status: number;
    code: string | null;
    constructor(status: number, code: string | null, message: string) {
      super(message);
      this.name = 'EmployerJobsApiError';
      this.status = status;
      this.code = code;
    }
  }
  return { listEmployerPostings: vi.fn(), EmployerJobsApiError };
});

vi.mock('../../../src/api/employer-jobs-api', () => ({ listEmployerPostings, EmployerJobsApiError }));

import EmployerJobsList from '../../../src/pages/employer/Jobs';

function posting(overrides: Partial<Posting> = {}): Posting {
  return {
    id: 'p1', slug: 'react-developer', title: 'React Developer', description: 'x', descriptionPlain: 'x',
    location: 'Bangalore', workplaceType: 'remote', employmentType: 'full-time',
    salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active' as PostingStatus,
    postedAt: 't', createdAt: '2026-06-01T00:00:00Z', updatedAt: 't', ...overrides,
  };
}

function renderList() {
  return render(
    <MemoryRouter initialEntries={['/employer/jobs']}>
      <Routes>
        <Route path="/employer/jobs" element={<EmployerJobsList />} />
        <Route path="/employer/jobs/:postingId" element={<div>DETAIL PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => listEmployerPostings.mockReset());

describe('EmployerJobsList', () => {
  it('shows a skeleton while loading', async () => {
    let resolveList: (value: Posting[]) => void = () => {};
    listEmployerPostings.mockReturnValue(new Promise<Posting[]>((resolve) => { resolveList = resolve; }));
    const { container } = renderList();
    expect(container.querySelector('[aria-hidden]')).not.toBeNull();
    expect(screen.queryByText('No postings yet')).toBeNull();
    resolveList([]); // resolve so the pending state does not leak into the next test
    await screen.findByText('No postings yet');
  });

  it('shows the first-posting CTA when empty on the All tab', async () => {
    listEmployerPostings.mockResolvedValue([]);
    renderList();
    expect(await screen.findByText('No postings yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create your first posting' })).toBeInTheDocument();
  });

  it('shows the status-specific empty copy when a filter is active', async () => {
    listEmployerPostings.mockResolvedValue([]);
    renderList();
    await screen.findByText('No postings yet');
    fireEvent.click(screen.getByRole('tab', { name: 'Draft' }));
    expect(await screen.findByText('No postings in this status')).toBeInTheDocument();
  });

  it('renders postings with status badges', async () => {
    listEmployerPostings.mockResolvedValue([
      posting({ id: 'a', title: 'Active Role', status: 'active' }),
      posting({ id: 'd', title: 'Draft Role', status: 'draft' }),
    ]);
    renderList();
    expect(await screen.findByText('Active Role')).toBeInTheDocument();
    expect(screen.getByText('Draft Role')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('changing tabs refetches with the new status', async () => {
    listEmployerPostings.mockResolvedValue([]);
    renderList();
    await screen.findByText('No postings yet');
    fireEvent.click(screen.getByRole('tab', { name: 'Active' }));
    await waitFor(() => expect(listEmployerPostings).toHaveBeenLastCalledWith({ status: 'active' }));
  });

  it('error state shows an Alert + Retry that reloads', async () => {
    listEmployerPostings.mockRejectedValueOnce(new EmployerJobsApiError(500, 'BOOM', 'Server exploded'));
    renderList();
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    listEmployerPostings.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No postings yet')).toBeInTheDocument();
  });

  it('Refresh button triggers another load', async () => {
    listEmployerPostings.mockResolvedValue([]);
    renderList();
    await screen.findByText('No postings yet');
    const before = listEmployerPostings.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(listEmployerPostings.mock.calls.length).toBe(before + 1));
  });

  it('clicking a posting title navigates to its detail route', async () => {
    listEmployerPostings.mockResolvedValue([posting({ id: 'p42', title: 'Go to detail' })]);
    renderList();
    fireEvent.click(await screen.findByText('Go to detail'));
    expect(screen.getByText('DETAIL PAGE')).toBeInTheDocument();
  });
});
