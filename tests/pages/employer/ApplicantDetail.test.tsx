// FILE: tests/pages/employer/ApplicantDetail.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { Applicant, ApplicantDetail, Stage } from '../../../src/types/employer-applicants';

const api = vi.hoisted(() => {
  class EmployerApplicantsApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) {
      super(message); this.status = status; this.code = code;
    }
  }
  return {
    fetchApplicantDetail: vi.fn(), listApplicantsForPosting: vi.fn(),
    listStages: vi.fn(), listArchiveReasons: vi.fn(),
    refreshResumeUrl: vi.fn(), moveApplicant: vi.fn(), archiveApplicant: vi.fn(), unarchiveApplicant: vi.fn(),
    EmployerApplicantsApiError,
  };
});

vi.mock('../../../src/api/employer-applicants-api', () => api);

const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateSpy };
});

import ApplicantDetailPage from '../../../src/pages/employer/Jobs/ApplicantDetail';

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
];

function listApp(id: string): Applicant {
  return {
    application: { id, jobId: 'j1', contactId: `c-${id}`, stageId: 's1', archived: null, appliedAt: 't', lastStageMovedAt: 't' },
    contact: { id: `c-${id}`, email: `${id}@x.com`, fullName: id, phone: null },
    score: null,
  };
}
const THREE = [listApp('a1'), listApp('a2'), listApp('a3')];

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

function renderPage(path = '/employer/jobs/p1/applicants/a1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/employer/jobs/:postingId/applicants/:appId" element={<ApplicantDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
}

beforeEach(() => {
  api.fetchApplicantDetail.mockReset();
  api.listApplicantsForPosting.mockReset().mockResolvedValue([]);
  api.listStages.mockReset().mockResolvedValue(STAGES);
  api.listArchiveReasons.mockReset().mockResolvedValue([]);
  navigateSpy.mockReset();
  setViewportWidth(1200); // desktop (twoColumn) unless a test overrides it
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
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/api/public/resume-download?token=t1#zoom=page-width');
    expect(screen.getByText('82')).toBeInTheDocument(); // score card
    expect(screen.getByRole('button', { name: /Stage history/ })).toBeInTheDocument();
    expect(screen.queryByText('No stage changes yet.')).toBeNull(); // collapsed by default (P3.2)
  });

  it('desktop: renders the sticky bar and hides the PageHeader (P2.1/P2.4)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.getByRole('link', { name: 'Back to posting' })).toBeInTheDocument(); // sticky back CTA
    expect(screen.queryByText('APPLICANT')).toBeNull(); // PageHeader label not rendered
  });

  it('mobile: renders the PageHeader and no sticky bar', async () => {
    setViewportWidth(800);
    api.fetchApplicantDetail.mockResolvedValue(detail());
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.getByText('APPLICANT')).toBeInTheDocument(); // PageHeader label present
  });

  it('desktop grid uses the wider 1.9fr PDF column (P2.2 regression guard)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    expect(container.querySelector('div[style*="1.9fr"]')).not.toBeNull();
  });

  it('?from=pipeline → back link labelled "Back to Pipeline" pointing at the tab (P1.4/P2.1)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    renderPage('/employer/jobs/p1/applicants/a1?from=pipeline');
    await screen.findByText('Asha Rao');
    expect(screen.getByRole('link', { name: /Back to Pipeline/ })).toHaveAttribute('href', '/employer/jobs/p1?tab=pipeline');
  });

  it('?from=ranked → back link labelled "Back to Ranked" pointing at the tab (P1.4/P2.1)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    renderPage('/employer/jobs/p1/applicants/a1?from=ranked');
    await screen.findByText('Asha Rao');
    expect(screen.getByRole('link', { name: /Back to Ranked/ })).toHaveAttribute('href', '/employer/jobs/p1?tab=ranked');
  });

  it('no ?from → generic "Back to posting" label and no tab query (P1.4)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.getByRole('link', { name: /Back to posting/ })).toHaveAttribute('href', '/employer/jobs/p1');
  });

  // ─── PP2: prev/next candidate nav ─────────────────────────────────

  it('middle applicant → "2 of 3" with prev and next enabled', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    api.listApplicantsForPosting.mockResolvedValue(THREE);
    renderPage('/employer/jobs/p1/applicants/a2');
    await screen.findByText('Asha Rao');
    expect(await screen.findByText('2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Previous applicant' })).toHaveAttribute('href', '/employer/jobs/p1/applicants/a1');
    expect(screen.getByRole('link', { name: 'Next applicant' })).toHaveAttribute('href', '/employer/jobs/p1/applicants/a3');
  });

  it('first applicant → prev disabled, next enabled, "1 of 3"', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    api.listApplicantsForPosting.mockResolvedValue(THREE);
    renderPage('/employer/jobs/p1/applicants/a1');
    await screen.findByText('1 of 3');
    expect(screen.getByRole('button', { name: 'Previous applicant' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Next applicant' })).toBeInTheDocument();
  });

  it('current applicant not in the list → no prev/next, no position text', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    api.listApplicantsForPosting.mockResolvedValue([listApp('x1'), listApp('x2')]);
    renderPage('/employer/jobs/p1/applicants/a1');
    await screen.findByText('Asha Rao');
    await waitFor(() => expect(api.listApplicantsForPosting).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: 'Next applicant' })).toBeNull();
    expect(screen.queryByText(/ of /)).toBeNull();
  });

  it('list sort follows ?from: ranked→score, pipeline→date, none→date', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const r1 = renderPage('/employer/jobs/p1/applicants/a1?from=ranked');
    await waitFor(() => expect(api.listApplicantsForPosting).toHaveBeenCalledWith('p1', { sort: 'score' }));
    r1.unmount(); api.listApplicantsForPosting.mockClear();
    const r2 = renderPage('/employer/jobs/p1/applicants/a1?from=pipeline');
    await waitFor(() => expect(api.listApplicantsForPosting).toHaveBeenCalledWith('p1', { sort: 'date' }));
    r2.unmount(); api.listApplicantsForPosting.mockClear();
    renderPage('/employer/jobs/p1/applicants/a1');
    await waitFor(() => expect(api.listApplicantsForPosting).toHaveBeenCalledWith('p1', { sort: 'date' }));
  });

  it('list fetch failure degrades silently — detail renders, no prev/next, no Alert', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    api.listApplicantsForPosting.mockRejectedValue(new Error('list boom'));
    renderPage('/employer/jobs/p1/applicants/a1');
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    await waitFor(() => expect(api.listApplicantsForPosting).toHaveBeenCalled());
    expect(screen.queryByRole('link', { name: 'Next applicant' })).toBeNull();
    expect(screen.queryByText('list boom')).toBeNull();
  });

  it('ArrowRight navigates to the next applicant, preserving ?from', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    api.listApplicantsForPosting.mockResolvedValue(THREE);
    renderPage('/employer/jobs/p1/applicants/a2?from=ranked');
    await screen.findByText('2 of 3');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(navigateSpy).toHaveBeenCalledWith('/employer/jobs/p1/applicants/a3?from=ranked');
  });

  it('ArrowLeft while typing in a textarea does not navigate', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    api.listApplicantsForPosting.mockResolvedValue(THREE);
    renderPage('/employer/jobs/p1/applicants/a2?from=ranked');
    await screen.findByText('2 of 3');
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(navigateSpy).not.toHaveBeenCalled();
    textarea.remove();
  });

  // ─── P3: sidebar scroll + default-collapsed content ───────────────

  it('desktop: the sidebar wrapper owns its scroll (maxHeight + overflowY)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    const scroller = container.querySelector('div[style*="overflow-y: auto"]') as HTMLElement | null;
    expect(scroller).not.toBeNull();
    expect(scroller?.getAttribute('style')).toContain('calc(100vh');
  });

  it('mobile: the sidebar is not wrapped in a scroll container', async () => {
    setViewportWidth(800);
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    expect(container.querySelector('div[style*="overflow-y: auto"]')).toBeNull();
  });

  it('Summary and Stage history default collapsed on load (content absent until opened)', async () => {
    const withContent = {
      ...detail(),
      score: { ...detail().score!, explanation: 'Strong React and AWS match.' },
      stageChanges: [{ id: 'sc1', fromStageId: 's1', toStageId: 's1', movedByUserId: 'u1', note: 'Applied', movedAt: '2026-06-01T00:00:00Z' }],
    };
    api.fetchApplicantDetail.mockResolvedValue(withContent);
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.queryByText('Strong React and AWS match.')).toBeNull(); // Summary collapsed
    expect(screen.queryAllByRole('listitem')).toHaveLength(0); // Stage history collapsed
  });
});
