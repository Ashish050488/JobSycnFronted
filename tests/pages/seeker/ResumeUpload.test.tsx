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
  return { uploadResume: vi.fn(), uploadResumeText: vi.fn(), SeekerApiError };
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

beforeEach(() => {
  vi.clearAllMocks();
  dpdp.fetchNoticeVersion.mockResolvedValue({ version: 'v1.0-2026-07', policyUrl: '/legal/privacy', grievanceEmail: 'p@x.in', crossBorderEnabled: true });
});

describe('ResumeUpload page', () => {
  it('gates the upload zone behind ConsentGate when consent is missing', async () => {
    dpdp.listConsents.mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText('Resume parsing consent')).toBeInTheDocument();
    expect(screen.queryByText(/Drag and drop your resume PDF/i)).toBeNull();
  });

  it('reveals the upload zone once consent for resume_parsing is active', async () => {
    dpdp.listConsents.mockResolvedValue([{ purpose: 'resume_parsing', withdrawnAt: null }]);
    renderPage();
    expect(await screen.findByText(/Drag and drop your resume PDF/i)).toBeInTheDocument();
  });

  it('navigates to /profile after a successful upload', async () => {
    dpdp.listConsents.mockResolvedValue([{ purpose: 'resume_parsing', withdrawnAt: null }]);
    seeker.uploadResume.mockResolvedValue({ profile: { fullName: 'Asha' }, isUnchanged: false });
    const { container } = renderPage();
    await screen.findByText(/Drag and drop your resume PDF/i);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1000 });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText('PROFILE PAGE')).toBeInTheDocument();
  });
});
