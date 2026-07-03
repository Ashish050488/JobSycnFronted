// FILE: tests/pages/employer/ApplicantDetail.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ApplicantDetail, Stage } from '../../../src/types/employer-applicants';

const api = vi.hoisted(() => {
  class EmployerApplicantsApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) {
      super(message); this.status = status; this.code = code;
    }
  }
  return {
    fetchApplicantDetail: vi.fn(), listStages: vi.fn(), listArchiveReasons: vi.fn(),
    refreshResumeUrl: vi.fn(), moveApplicant: vi.fn(), archiveApplicant: vi.fn(), unarchiveApplicant: vi.fn(),
    EmployerApplicantsApiError,
  };
});

vi.mock('../../../src/api/employer-applicants-api', () => api);

import ApplicantDetailPage from '../../../src/pages/employer/Jobs/ApplicantDetail';

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
];

function detail(): ApplicantDetail {
  return {
    application: { id: 'a1', jobId: 'j1', contactId: 'c1', stageId: 's1', archived: null, appliedAt: 't', lastStageMovedAt: 't' },
    contact: { id: 'c1', email: 'asha@x.com', fullName: 'Asha Rao', phone: null },
    score: { id: 'sc1', score: 82, tier: 'good', matchedSkills: [], missingSkills: [], explanation: null, processedAt: 't', processingError: null },
    stageChanges: [],
    resumeMeta: { id: 'r1', originalFilename: 'cv.pdf', mimeType: 'application/pdf', sizeBytes: 1000, uploadedAt: 't' },
    resumeDownloadUrl: '/api/public/resume-download?token=t1',
    resumeDownloadExpiresAt: null,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/employer/jobs/p1/applicants/a1']}>
      <Routes>
        <Route path="/employer/jobs/:postingId/applicants/:appId" element={<ApplicantDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  api.fetchApplicantDetail.mockReset();
  api.listStages.mockReset().mockResolvedValue(STAGES);
  api.listArchiveReasons.mockReset().mockResolvedValue([]);
});

describe('ApplicantDetail page', () => {
  it('shows a skeleton while loading', () => {
    api.fetchApplicantDetail.mockReturnValue(new Promise(() => {}));
    const { container } = renderPage();
    expect(container.querySelector('[aria-hidden]')).not.toBeNull();
  });

  it('renders a not-found alert with a back link on 404', async () => {
    api.fetchApplicantDetail.mockRejectedValue(new api.EmployerApplicantsApiError(404, 'NOT_FOUND', 'nope'));
    renderPage();
    expect(await screen.findByText(/Applicant not found/)).toBeInTheDocument();
    const backLinks = screen.getAllByRole('link', { name: 'Back to posting' });
    expect(backLinks[0]).toHaveAttribute('href', '/employer/jobs/p1');
  });

  it('renders the loaded layout: name, resume viewer and stage history', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('asha@x.com')).toBeInTheDocument();
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/api/public/resume-download?token=t1');
    expect(screen.getByText('82')).toBeInTheDocument(); // score card
    expect(screen.getByText('Stage history')).toBeInTheDocument();
    expect(screen.getByText('No stage changes yet.')).toBeInTheDocument();
  });
});
