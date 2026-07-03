// FILE: tests/pages/seeker/ResumeUpload.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const dpdp = vi.hoisted(() => {
  class DpdpApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { listConsents: vi.fn(), grantConsent: vi.fn(), fetchNoticeVersion: vi.fn(), DpdpApiError };
});
const seeker = vi.hoisted(() => {
  class SeekerApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { uploadResume: vi.fn(), uploadResumeText: vi.fn(), fetchResumeJob: vi.fn(), SeekerApiError };
});
vi.mock('../../../src/api/dpdp-api', () => dpdp);
vi.mock('../../../src/api/seeker-api', () => seeker);

import { ToastProvider } from '../../../src/components/ui';
import ResumeUpload from '../../../src/pages/seeker/ResumeUpload';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/resume']}>
      <ToastProvider>
        <Routes>
          <Route path="/resume" element={<ResumeUpload />} />
          <Route path="/profile" element={<div>PROFILE PAGE</div>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

async function dropPdf(container: HTMLElement) {
  await screen.findByText(/Drag and drop your resume PDF/i);
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: 1000 });
  fireEvent.change(input, { target: { files: [file] } });
}

const doneJob = { id: 'job-1', status: 'done', result: { profile: { fullName: 'Asha' }, isUnchanged: false }, errorCode: null, errorMessage: null };

beforeEach(() => {
  vi.clearAllMocks();
  dpdp.fetchNoticeVersion.mockResolvedValue({ version: 'v1.0-2026-07', policyUrl: '/legal/privacy', grievanceEmail: 'p@x.in', crossBorderEnabled: true });
  dpdp.listConsents.mockResolvedValue([{ purpose: 'resume_parsing', withdrawnAt: null }]);
});

describe('ResumeUpload page', () => {
  it('dedup fast-path → toast + navigate to /profile without polling', async () => {
    seeker.uploadResume.mockResolvedValue({ kind: 'unchanged', profile: { fullName: 'Asha' } });
    const { container } = renderPage();
    await dropPdf(container);
    expect(await screen.findByText('PROFILE PAGE')).toBeInTheDocument();
    expect(seeker.fetchResumeJob).not.toHaveBeenCalled();
  });

  it('queued path → renders the parsing screen while polling, then navigates on done', async () => {
    seeker.uploadResume.mockResolvedValue({ kind: 'queued', jobId: 'job-1' });
    seeker.fetchResumeJob
      .mockResolvedValueOnce({ id: 'job-1', status: 'processing', result: null, errorCode: null, errorMessage: null })
      .mockResolvedValue(doneJob);
    const { container } = renderPage();
    await dropPdf(container);
    expect(await screen.findByText('Parsing your resume…')).toBeInTheDocument();
    expect(await screen.findByText('PROFILE PAGE', undefined, { timeout: 3000 })).toBeInTheDocument();
  });

  it('failed path → renders the error screen; Retry returns to the upload zone', async () => {
    seeker.uploadResume.mockResolvedValue({ kind: 'queued', jobId: 'job-1' });
    seeker.fetchResumeJob.mockResolvedValue({ id: 'job-1', status: 'failed', result: null, errorCode: 'RESUME_PARSE_FAILED', errorMessage: 'nope' });
    const { container } = renderPage();
    await dropPdf(container);
    expect(await screen.findByText(/We couldn't parse your resume/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/Drag and drop your resume PDF/i)).toBeInTheDocument();
  });
});
