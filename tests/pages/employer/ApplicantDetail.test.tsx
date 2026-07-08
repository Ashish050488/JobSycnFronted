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
    application: { id, jobId: 'j1', contactId: `c-${id}`, stageId: 's1', archived: null, appliedAt: 't', coverNote: null, lastStageMovedAt: 't' },
    contact: { id: `c-${id}`, email: `${id}@x.com`, fullName: id, phone: null },
    score: null,
  };
}
const THREE = [listApp('a1'), listApp('a2'), listApp('a3')];

function detail(): ApplicantDetail {
  return {
    application: { id: 'a1', jobId: 'j1', contactId: 'c1', stageId: 's1', archived: null, appliedAt: 't', coverNote: null, lastStageMovedAt: 't' },
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
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/api/public/resume-download?token=t1#zoom=page-width&navpanes=0');
    expect(screen.getByText('82')).toBeInTheDocument(); // ApplicantReviewPanel score hero
    // The review panel renders its one-line history footer; detail() has no changes.
    expect(screen.getByText('No stage changes yet')).toBeInTheDocument();
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

  it('desktop grid uses the 1.4fr PDF column + 360px sidebar min (P5 regression guard)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    const grid = container.querySelector('div[style*="1.4fr"]');
    expect(grid).not.toBeNull();
    expect(grid?.getAttribute('style')).toContain('minmax(360px');
  });

  it('desktop: content is full-width (opts out of the Container max-width cap) (P5/D1)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    // The outer wrapper is a plain padded div, not the centred Container (max-width:1200px).
    const outer = container.firstElementChild as HTMLElement | null;
    expect(outer?.getAttribute('style')).toContain('width: 100%');
    expect(outer?.getAttribute('style')).not.toContain('max-width');
    expect(outer?.getAttribute('style')).toContain('box-sizing: border-box');
  });

  it('mobile: content stays inside the centred Container (max-width cap kept) (P5/D1)', async () => {
    setViewportWidth(800);
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    const outer = container.firstElementChild as HTMLElement | null;
    expect(outer?.getAttribute('style')).toContain('max-width');
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

  it('desktop: the sidebar column owns its scroll (height:100% + overflowY:auto)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    const scroller = container.querySelector('div[style*="overflow-y: auto"]') as HTMLElement | null;
    expect(scroller).not.toBeNull();
    expect(scroller?.getAttribute('style')).toContain('height: 100%');
  });

  it('mobile: the page is not height-pinned (document flow, no desktop scroll column)', async () => {
    setViewportWidth(800);
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    const outer = container.firstElementChild as HTMLElement | null;
    expect(outer?.getAttribute('style')).not.toContain('overflow: hidden');
    // The desktop grid's fixed-height scroll column is absent on mobile.
    expect(container.querySelector('div[style*="height: 100%"][style*="overflow-y: auto"]')).toBeNull();
  });

  it('Summary and the latest-stage line are visible on load without interaction (P4.1)', async () => {
    const withContent = {
      ...detail(),
      score: { ...detail().score!, explanation: 'Strong React and AWS match.' },
      stageChanges: [{ id: 'sc1', fromStageId: null, toStageId: 's1', movedByUserId: 'u1', note: 'Applied', movedAt: '2026-06-01T00:00:00Z' }],
    };
    api.fetchApplicantDetail.mockResolvedValue(withContent);
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.getByText('Strong React and AWS match.')).toBeInTheDocument(); // Summary always visible
    expect(screen.getByText(/Applied ·/)).toBeInTheDocument(); // one-line stage history visible
  });

  it('renders the redesigned review panel with score, actions and fit (P9)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.getByText('82')).toBeInTheDocument(); // score hero
    expect(screen.getByText('/ 100')).toBeInTheDocument(); // hero meter caption
    expect(screen.getByRole('button', { name: 'Move stage' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument(); // fit tile
  });

  it('desktop: the page wrapper is height-pinned + overflow:hidden so the document never scrolls (P8.2)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    const outer = container.firstElementChild as HTMLElement | null;
    expect(outer?.getAttribute('style')).toContain('overflow: hidden');
    expect(outer?.getAttribute('style')).toContain('calc(100vh - 65px)');
    // Tightened guard (P7 review): the grid's TWO DIRECT children each own height:100%.
    const grid = container.querySelector('div[style*="grid-template-columns"]') as HTMLElement | null;
    expect(grid).not.toBeNull();
    const columns = Array.from(grid!.children) as HTMLElement[];
    expect(columns).toHaveLength(2);
    columns.forEach((col) => expect(col.getAttribute('style')).toContain('height: 100%'));
    expect(columns[1].getAttribute('style')).toContain('overflow-y: auto'); // sidebar scrolls
  });

  it('mobile: the page wrapper is not height-pinned / overflow-hidden (P7.2 regression guard)', async () => {
    setViewportWidth(800);
    api.fetchApplicantDetail.mockResolvedValue(detail());
    const { container } = renderPage();
    await screen.findByText('Asha Rao');
    const outer = container.firstElementChild as HTMLElement | null;
    expect(outer?.getAttribute('style')).not.toContain('overflow: hidden');
  });

  // ─── Cover note card (fix/cover-note-display) ─────────────────────

  function detailWithNote(coverNote: string | null): ApplicantDetail {
    const base = detail();
    return { ...base, application: { ...base.application, coverNote } };
  }

  it('non-empty coverNote → "Cover note" label and the note text both render', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detailWithNote('i am very interested in this role'));
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.getByText('Cover note')).toBeInTheDocument();
    expect(screen.getByText(/i am very interested in this role/)).toBeInTheDocument();
  });

  it('null coverNote → no "Cover note" label anywhere', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detailWithNote(null));
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.queryByText('Cover note')).toBeNull();
  });

  it('empty-string coverNote → no card (treated the same as null)', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detailWithNote(''));
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.queryByText('Cover note')).toBeNull();
  });

  it('whitespace-only coverNote → no card rendered', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detailWithNote('   '));
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.queryByText('Cover note')).toBeNull();
  });

  it('note text preserves line breaks via white-space: pre-wrap', async () => {
    api.fetchApplicantDetail.mockResolvedValue(detailWithNote('line one\nline two'));
    renderPage();
    await screen.findByText('Asha Rao');
    const note = screen.getByText(/line one/);
    expect(note.getAttribute('style')).toContain('white-space: pre-wrap');
    expect(note.textContent).toContain('line one\nline two');
  });

  it('mobile: the cover note still renders in the stacked layout', async () => {
    setViewportWidth(800);
    api.fetchApplicantDetail.mockResolvedValue(detailWithNote('reach me anytime'));
    renderPage();
    await screen.findByText('Asha Rao');
    expect(screen.getByText('Cover note')).toBeInTheDocument();
    expect(screen.getByText(/reach me anytime/)).toBeInTheDocument();
  });
});
