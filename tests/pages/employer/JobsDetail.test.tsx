// FILE: tests/pages/employer/JobsDetail.test.tsx
// Stubs global fetch so getEmployerPosting runs for real. useEmployer is mocked
// (DetailSettings reads company.slug for the apply URL).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { EmployerCtx } from '../../../src/context/employer/employer-context-types';
import { ToastProvider } from '../../../src/components/ui';

const ctxValue = { company: { slug: 'acme' } } as unknown as EmployerCtx;
vi.mock('../../../src/context/employer/EmployerContext', () => ({ useEmployer: () => ctxValue }));

import EmployerJobsDetail from '../../../src/pages/employer/Jobs/Detail';

const POSTING = {
  id: 'p1', slug: 'react-dev', title: 'React Developer', description: 'A great role indeed.',
  descriptionPlain: 'A great role indeed.', location: 'Bangalore', workplaceType: 'remote',
  employmentType: 'full-time', salaryMin: null, salaryMax: null, salaryCurrency: 'INR',
  status: 'active', postedAt: '2026-06-29T00:00:00Z', createdAt: '2026-06-28T00:00:00Z',
  updatedAt: '2026-06-30T00:00:00Z',
};

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
function stubFetch(impl: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

function renderDetail(path = '/employer/jobs/p1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <Routes>
          <Route path="/employer/jobs/:postingId" element={<EmployerJobsDetail />} />
          <Route path="/employer/jobs" element={<div>POSTINGS LIST</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

// Stubs the posting fetch plus the empty applicant/stage lists the Pipeline/Ranked
// tabs fire on mount, so tabs can render their real content.
function stubDetailWithTabs() {
  stubFetch((async (url: string) => {
    if (url.includes('/applicants')) return response(200, { applicants: [] });
    if (url.includes('/stages')) return response(200, { stages: [] });
    return response(200, { posting: POSTING });
  }) as unknown as () => Promise<Response>);
}

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
});

describe('EmployerJobsDetail', () => {
  it('shows a loading skeleton while the fetch is pending', () => {
    stubFetch(() => new Promise(() => {}));
    const { container } = renderDetail();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(screen.queryByText('React Developer')).toBeNull();
  });

  it('renders a not-found alert with a Back link on 404', async () => {
    stubFetch(async () => response(404, { error: 'nope', code: 'POSTING_NOT_FOUND' }));
    renderDetail();
    expect(await screen.findByText(/Posting not found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to postings' })).toBeInTheDocument();
  });

  it('renders an error alert with Retry on a non-404 error', async () => {
    stubFetch(async () => response(500, { error: 'Server exploded' }));
    renderDetail();
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('renders title, status badge and tabs on a successful load', async () => {
    stubFetch(async () => response(200, { posting: POSTING }));
    renderDetail();
    expect(await screen.findByRole('heading', { name: 'React Developer' })).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Settings' })).toBeInTheDocument();
  });

  it('Pipeline + Ranked tabs mount their real content', async () => {
    stubDetailWithTabs();
    renderDetail();
    await screen.findByRole('heading', { name: 'React Developer' });

    fireEvent.click(screen.getByRole('tab', { name: 'Ranked' }));
    await waitFor(() => expect(screen.getByText('No applications yet')).toBeInTheDocument());
  });

  it('does NOT render the Stats tab (P1.2 regression guard)', async () => {
    stubDetailWithTabs();
    renderDetail();
    await screen.findByRole('heading', { name: 'React Developer' });
    expect(screen.queryByRole('tab', { name: 'Stats' })).toBeNull();
    expect(screen.queryByText(/Ships in Step 8/)).toBeNull();
  });

  it('?tab=pipeline selects the Pipeline tab by default', async () => {
    stubDetailWithTabs();
    renderDetail('/employer/jobs/p1?tab=pipeline');
    await screen.findByRole('heading', { name: 'React Developer' });
    expect(screen.getByRole('tab', { name: 'Pipeline' })).toHaveAttribute('aria-selected', 'true');
  });

  it('?tab=ranked selects the Ranked tab by default', async () => {
    stubDetailWithTabs();
    renderDetail('/employer/jobs/p1?tab=ranked');
    await screen.findByRole('heading', { name: 'React Developer' });
    expect(screen.getByRole('tab', { name: 'Ranked' })).toHaveAttribute('aria-selected', 'true');
  });

  it('?tab=badvalue falls back to the Settings tab', async () => {
    stubDetailWithTabs();
    renderDetail('/employer/jobs/p1?tab=badvalue');
    await screen.findByRole('heading', { name: 'React Developer' });
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  });

  it('no ?tab defaults to the Settings tab', async () => {
    stubDetailWithTabs();
    renderDetail();
    await screen.findByRole('heading', { name: 'React Developer' });
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  });
});
