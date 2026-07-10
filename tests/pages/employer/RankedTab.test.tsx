// FILE: tests/pages/employer/RankedTab.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Applicant, ArchiveReason, Stage } from '../../../src/types/employer-applicants';
import { ToastProvider } from '../../../src/components/ui';

const {
  listApplicantsForPosting, listStages, listArchiveReasons, bulkArchiveApplicants, EmployerApplicantsApiError,
} = vi.hoisted(() => {
  class EmployerApplicantsApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) {
      super(message); this.name = 'EmployerApplicantsApiError'; this.status = status; this.code = code;
    }
  }
  return {
    listApplicantsForPosting: vi.fn(), listStages: vi.fn(), listArchiveReasons: vi.fn(),
    bulkArchiveApplicants: vi.fn(), EmployerApplicantsApiError,
  };
});

vi.mock('../../../src/api/employer-applicants-api', () => ({
  listApplicantsForPosting, listStages, listArchiveReasons, bulkArchiveApplicants, EmployerApplicantsApiError,
}));

import RankedTab from '../../../src/pages/employer/Jobs/RankedTab';

const STAGES: Stage[] = [
  { id: 's1', text: 'Screening', order: 1, isTerminal: false, isDefault: true, terminalType: null },
];
const REASONS: ArchiveReason[] = [{ id: 'r1', text: 'Underqualified', type: 'non-hired', status: 'active' }];

function applicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    application: { id: 'a1', jobId: 'j1', contactId: 'c1', stageId: 's1', archived: null, appliedAt: '2026-06-01T00:00:00Z', lastStageMovedAt: 't' },
    contact: { id: 'c1', email: 'asha@x.com', fullName: 'Asha Rao', phone: null },
    score: { id: 'sc1', score: 82, tier: 'good', matchedSkills: [], missingSkills: [], explanation: null, processedAt: 't', processingError: null },
    ...overrides,
  };
}

function appAt(id: string): Applicant {
  return {
    application: { id, jobId: 'j1', contactId: `c-${id}`, stageId: 's1', archived: null, appliedAt: '2026-06-01T00:00:00Z', lastStageMovedAt: 't' },
    contact: { id: `c-${id}`, email: `${id}@x.com`, fullName: `Name ${id}`, phone: null },
    score: null,
  };
}

function renderTab() {
  return render(<MemoryRouter><ToastProvider><RankedTab postingId="p1" /></ToastProvider></MemoryRouter>);
}

beforeEach(() => {
  listApplicantsForPosting.mockReset();
  listStages.mockReset().mockResolvedValue(STAGES);
  listArchiveReasons.mockReset().mockResolvedValue([]);
  bulkArchiveApplicants.mockReset();
});

describe('RankedTab', () => {
  it('shows a skeleton while loading', async () => {
    let resolve: (value: Applicant[]) => void = () => {};
    listApplicantsForPosting.mockReturnValue(new Promise<Applicant[]>((r) => { resolve = r; }));
    const { container } = renderTab();
    expect(container.querySelector('[aria-hidden]')).not.toBeNull();
    resolve([]);
    await screen.findByText('No applications yet');
  });

  it('shows the empty state when there are no applicants', async () => {
    listApplicantsForPosting.mockResolvedValue([]);
    renderTab();
    expect(await screen.findByText('No applications yet')).toBeInTheDocument();
  });

  it('renders applicant rows with a tier score badge', async () => {
    listApplicantsForPosting.mockResolvedValue([applicant()]);
    renderTab();
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('asha@x.com')).toBeInTheDocument();
    expect(screen.getByText('AI Score 82/100 · good match')).toBeInTheDocument();
    // Scoped to the table: "Screening" also names a stage filter chip now.
    expect(within(screen.getByRole('table')).getByText('Screening')).toBeInTheDocument();
  });

  it('shows "Not scored" when score is null and the application is old (P1.5)', async () => {
    listApplicantsForPosting.mockResolvedValue([applicant({
      score: null,
      application: { id: 'a1', jobId: 'j1', contactId: 'c1', stageId: 's1', archived: null, appliedAt: '2020-01-01T00:00:00Z', lastStageMovedAt: 't' },
    })]);
    renderTab();
    expect(await screen.findByText('Not scored')).toBeInTheDocument();
  });

  it('shows "Scoring…" when score is null but the application is fresh (P1.5)', async () => {
    listApplicantsForPosting.mockResolvedValue([applicant({
      score: null,
      application: { id: 'a1', jobId: 'j1', contactId: 'c1', stageId: 's1', archived: null, appliedAt: new Date().toISOString(), lastStageMovedAt: 't' },
    })]);
    renderTab();
    expect(await screen.findByText('Scoring…')).toBeInTheDocument();
  });

  it('changing the sort dropdown refetches with the new sort', async () => {
    listApplicantsForPosting.mockResolvedValue([applicant()]);
    renderTab();
    await screen.findByText('Asha Rao');
    fireEvent.change(screen.getByLabelText('Sort applicants'), { target: { value: 'date' } });
    await waitFor(() => expect(listApplicantsForPosting).toHaveBeenLastCalledWith('p1', { sort: 'date' }));
  });

  it('the View action links to the applicant detail route', async () => {
    listApplicantsForPosting.mockResolvedValue([applicant()]);
    renderTab();
    const link = (await screen.findByText('View')).closest('a');
    expect(link?.getAttribute('href')).toBe('/employer/jobs/p1/applicants/a1?from=ranked');
  });

  it('shows an error Alert + Retry that reloads', async () => {
    listApplicantsForPosting.mockRejectedValueOnce(new EmployerApplicantsApiError(500, 'BOOM', 'Server exploded'));
    renderTab();
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    listApplicantsForPosting.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No applications yet')).toBeInTheDocument();
  });

  // ─── PP3: bulk selection + archive ────────────────────────────────

  it('renders a select-all checkbox and per-row checkboxes', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1')]);
    renderTab();
    await screen.findByText('Name a1');
    expect(screen.getByLabelText('Select all applicants on this page')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Name a1')).toBeInTheDocument();
  });

  it('select-all is indeterminate when some but not all rows are selected', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1'), appAt('a2')]);
    renderTab();
    await screen.findByText('Name a1');
    fireEvent.click(screen.getByLabelText('Select Name a1'));
    const selectAll = screen.getByLabelText('Select all applicants on this page') as HTMLInputElement;
    expect(selectAll.indeterminate).toBe(true);
    expect(selectAll.checked).toBe(false);
  });

  it('select-all is checked when every row is selected', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1'), appAt('a2')]);
    renderTab();
    await screen.findByText('Name a1');
    fireEvent.click(screen.getByLabelText('Select all applicants on this page'));
    const selectAll = screen.getByLabelText('Select all applicants on this page') as HTMLInputElement;
    expect(selectAll.checked).toBe(true);
    expect(selectAll.indeterminate).toBe(false);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
  });

  it('row checkbox toggles selection (bar appears) without navigating', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1')]);
    renderTab();
    await screen.findByText('Name a1');
    const box = screen.getByLabelText('Select Name a1') as HTMLInputElement;
    fireEvent.click(box);
    expect(box.checked).toBe(true);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('the bar appears when selecting and hides on Clear', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1')]);
    renderTab();
    await screen.findByText('Name a1');
    expect(screen.queryByText(/selected/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Select Name a1'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText('1 selected')).toBeNull();
  });

  async function openDialogWithBothSelected() {
    listArchiveReasons.mockResolvedValue(REASONS);
    listApplicantsForPosting.mockResolvedValue([appAt('a1'), appAt('a2')]);
    renderTab();
    await screen.findByText('Name a1');
    fireEvent.click(screen.getByLabelText('Select all applicants on this page'));
    fireEvent.click(screen.getByRole('button', { name: 'Archive 2' })); // bar → open dialog
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('combobox'), { target: { value: 'r1' } });
    within(dialog).getByRole('button', { name: 'Archive 2' }).click();
  }

  it('full success → success toast, selection cleared, list reloaded', async () => {
    bulkArchiveApplicants.mockResolvedValue({ succeeded: [{ id: 'a1' }, { id: 'a2' }], failed: [], total: 2, successCount: 2, failureCount: 0 });
    await openDialogWithBothSelected();
    await screen.findByText(/Archived 2 applicant/);
    await waitFor(() => expect(listApplicantsForPosting).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('2 selected')).toBeNull();
  });

  it('partial success → warning toast, selection reduced to failed ids, list reloaded', async () => {
    bulkArchiveApplicants.mockResolvedValue({
      succeeded: [{ id: 'a1' }], failed: [{ id: 'a2', code: 'ALREADY_ARCHIVED', message: 'x' }],
      total: 2, successCount: 1, failureCount: 1,
    });
    await openDialogWithBothSelected();
    await screen.findByText(/Archived 1 of 2\. 1 failed/);
    await waitFor(() => expect(listApplicantsForPosting).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('1 selected')).toBeInTheDocument();
  });

  it('whole-request failure → error toast, selection intact, no reload, dialog stays open', async () => {
    bulkArchiveApplicants.mockRejectedValue(new EmployerApplicantsApiError(400, 'BULK_LIMIT_EXCEEDED', 'Too many'));
    await openDialogWithBothSelected();
    await screen.findByText(/up to 50 at a time/);
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(listApplicantsForPosting).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('prunes a selected id that is gone after a reload', async () => {
    listApplicantsForPosting.mockResolvedValueOnce([appAt('a1'), appAt('a2')]).mockResolvedValueOnce([appAt('a2')]);
    renderTab();
    await screen.findByText('Name a1');
    fireEvent.click(screen.getByLabelText('Select Name a1'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Sort applicants'), { target: { value: 'date' } });
    await waitFor(() => expect(screen.queryByText('Name a1')).toBeNull());
    expect(screen.queryByText('1 selected')).toBeNull();
  });

  // ─── Chunk 1: search + filter chips ───────────────────────────────

  /**
   * Type into the debounced search box and wait for the 200ms timer to settle.
   * "Clear filters" appearing is the signal that the search reached RankedTab —
   * queryAll because the no-match empty state renders a second one.
   */
  async function typeSearch(text: string) {
    fireEvent.change(screen.getByLabelText('Search name or email'), { target: { value: text } });
    await waitFor(() => expect(screen.queryAllByRole('button', { name: 'Clear filters' }).length).toBeGreaterThan(0));
  }

  // T21
  it('renders every applicant when no filter is active', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1'), appAt('a2')]);
    renderTab();
    expect(await screen.findByText('Name a1')).toBeInTheDocument();
    expect(screen.getByText('Name a2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  // T22
  it('typing in search filters the visible rows after the debounce', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1'), appAt('a2')]);
    renderTab();
    await screen.findByText('Name a1');
    await typeSearch('a2');
    await waitFor(() => expect(screen.queryByText('Name a1')).toBeNull());
    expect(screen.getByText('Name a2')).toBeInTheDocument();
  });

  // T23
  it('clicking a stage chip filters the visible rows', async () => {
    const inOtherStage = { ...appAt('a2') };
    inOtherStage.application = { ...inOtherStage.application, stageId: 's2' };
    listApplicantsForPosting.mockResolvedValue([appAt('a1'), inOtherStage]);
    renderTab();
    await screen.findByText('Name a1');
    fireEvent.click(screen.getByRole('button', { name: 'Screening' })); // only s1
    await waitFor(() => expect(screen.queryByText('Name a2')).toBeNull());
    expect(screen.getByText('Name a1')).toBeInTheDocument();
  });

  it('score chips filter on the derived bucket, including Unscored', async () => {
    const scored = applicant(); // tier 'good', Asha Rao
    listApplicantsForPosting.mockResolvedValue([scored, appAt('a2')]); // appAt has score: null
    renderTab();
    await screen.findByText('Asha Rao');
    fireEvent.click(screen.getByRole('button', { name: 'Unscored' }));
    await waitFor(() => expect(screen.queryByText('Asha Rao')).toBeNull());
    expect(screen.getByText('Name a2')).toBeInTheDocument();
  });

  it('archived applicants are hidden until Include archived is switched on', async () => {
    const archived = { ...appAt('a2') };
    archived.application = { ...archived.application, archived: { at: 't', reasonId: 'r1' } };
    listApplicantsForPosting.mockResolvedValue([appAt('a1'), archived]);
    renderTab();
    await screen.findByText('Name a1');
    expect(screen.queryByText('Name a2')).toBeNull();
    fireEvent.click(screen.getByLabelText('Include archived'));
    expect(await screen.findByText('Name a2')).toBeInTheDocument();
  });

  // T24
  it('shows the no-match empty state (not the no-applicants one) when filters exclude everything', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1')]);
    renderTab();
    await screen.findByText('Name a1');
    await typeSearch('zzzz-no-such-person');
    expect(await screen.findByText('No applicants match these filters')).toBeInTheDocument();
    expect(screen.queryByText('No applications yet')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Clear filters' }).length).toBeGreaterThan(0);
  });

  // T25
  it('Clear filters restores full visibility', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1')]);
    renderTab();
    await screen.findByText('Name a1');
    await typeSearch('zzzz');
    await screen.findByText('No applicants match these filters');
    fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);
    expect(await screen.findByText('Name a1')).toBeInTheDocument();
  });

  // T26 — selection survives a filter that hides the selected row (C11/R3).
  it('keeps a selection across filter changes, even while the row is hidden', async () => {
    listApplicantsForPosting.mockResolvedValue([appAt('a1'), appAt('a2')]);
    renderTab();
    await screen.findByText('Name a1');
    fireEvent.click(screen.getByLabelText('Select Name a1'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    await typeSearch('a2'); // hides a1
    await waitFor(() => expect(screen.queryByText('Name a1')).toBeNull());
    expect(screen.getByText('1 selected')).toBeInTheDocument(); // still selected while hidden

    fireEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0]);
    const box = (await screen.findByLabelText('Select Name a1')) as HTMLInputElement;
    expect(box.checked).toBe(true);
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });
});
