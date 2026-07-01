// FILE: tests/pages/employer/JobsNew.test.tsx
// Stubs global fetch (rather than mocking the api module) so createEmployerPosting
// runs for real and throws the real EmployerJobsApiError — exactly the path
// production takes, and the one PostingForm is built to catch.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from '../../../src/components/ui';
import EmployerJobsNew from '../../../src/pages/employer/Jobs/New';

const DESCRIPTION = 'We are hiring a senior engineer to build our applicant tracking system in India.';

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function stubFetch(impl: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

function renderNew() {
  return render(
    <MemoryRouter initialEntries={['/employer/jobs/new']}>
      <ToastProvider>
        <Routes>
          <Route path="/employer/jobs/new" element={<EmployerJobsNew />} />
          <Route path="/employer/jobs/:postingId" element={<div>POSTING DETAIL</div>} />
          <Route path="/employer/jobs" element={<div>POSTINGS LIST</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

function setText(label: string, value: string) {
  // Required-field labels carry a trailing "*", so match on a substring.
  fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
}

function fillValid() {
  setText('Job title', 'React Developer');
  setText('Workplace type', 'remote');
  setText('Employment type', 'full-time');
  setText('Location', 'Bangalore');
  setText('Job description', DESCRIPTION);
}

const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Create posting' }));

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => vi.clearAllMocks());

describe('EmployerJobsNew', () => {
  it('renders the create form', () => {
    stubFetch(async () => response(201, { posting: {} }));
    renderNew();
    expect(screen.getByRole('button', { name: 'Create posting' })).toBeInTheDocument();
  });

  it('on success toasts the title and navigates to the new posting detail', async () => {
    stubFetch(async () => response(201, { posting: { id: 'p1', title: 'React Developer' } }));
    renderNew();
    fillValid();
    submit();
    expect(await screen.findByText('POSTING DETAIL')).toBeInTheDocument();
    expect(screen.getByText('Posting created: React Developer')).toBeInTheDocument();
  });

  it('on a server error keeps the form and surfaces it without navigating', async () => {
    stubFetch(async () => response(400, { error: 'Bad title from server', code: 'INVALID_TITLE' }));
    renderNew();
    fillValid();
    submit();
    expect(await screen.findByText('Bad title from server')).toBeInTheDocument();
    expect(screen.queryByText('POSTINGS LIST')).toBeNull();
  });
});
