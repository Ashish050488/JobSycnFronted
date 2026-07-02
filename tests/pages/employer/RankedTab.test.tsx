// FILE: tests/pages/employer/RankedTab.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Applicant, Stage } from '../../../src/types/employer-applicants';

const { listApplicantsForPosting, listStages, EmployerApplicantsApiError } = vi.hoisted(() => {
  class EmployerApplicantsApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) {
      super(message); this.name = 'EmployerApplicantsApiError'; this.status = status; this.code = code;
    }
  }
  return { listApplicantsForPosting: vi.fn(), listStages: vi.fn(), EmployerApplicantsApiError };
});

vi.mock('../../../src/api/employer-applicants-api', () => ({
  listApplicantsForPosting, listStages, EmployerApplicantsApiError,
}));

import RankedTab from '../../../src/pages/employer/Jobs/RankedTab';

const STAGES: Stage[] = [
  { id: 's1', text: 'Screening', order: 1, isTerminal: false, isDefault: true, terminalType: null },
];

function applicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    application: { id: 'a1', jobId: 'j1', contactId: 'c1', stageId: 's1', archived: null, appliedAt: '2026-06-01T00:00:00Z', lastStageMovedAt: 't' },
    contact: { id: 'c1', email: 'asha@x.com', fullName: 'Asha Rao', phone: null },
    score: { id: 'sc1', score: 82, tier: 'good', matchedSkills: [], missingSkills: [], explanation: null, processedAt: 't', processingError: null },
    ...overrides,
  };
}

function renderTab() {
  return render(<MemoryRouter><RankedTab postingId="p1" /></MemoryRouter>);
}

beforeEach(() => {
  listApplicantsForPosting.mockReset();
  listStages.mockReset();
  listStages.mockResolvedValue(STAGES);
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
    expect(screen.getByText('82 · good')).toBeInTheDocument();
    expect(screen.getByText('Screening')).toBeInTheDocument(); // stage name
  });

  it('shows "Not scored" when score is null', async () => {
    listApplicantsForPosting.mockResolvedValue([applicant({ score: null })]);
    renderTab();
    expect(await screen.findByText('Not scored')).toBeInTheDocument();
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
    expect(link?.getAttribute('href')).toBe('/employer/jobs/p1/applicants/a1');
  });

  it('shows an error Alert + Retry that reloads', async () => {
    listApplicantsForPosting.mockRejectedValueOnce(new EmployerApplicantsApiError(500, 'BOOM', 'Server exploded'));
    renderTab();
    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
    listApplicantsForPosting.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No applications yet')).toBeInTheDocument();
  });
});
