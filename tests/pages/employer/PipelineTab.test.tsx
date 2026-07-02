// FILE: tests/pages/employer/PipelineTab.test.tsx
// Integration coverage for the Kanban tab: columns render from stages, counts are
// correct, archived cards are filtered out, and loading/error states behave. We do
// NOT simulate pointer drag events (the move logic is unit-tested in
// pipeline-tab-helpers.test.ts, R6) — here we assert the board renders cleanly.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Applicant, Stage } from '../../../src/types/employer-applicants';

const { listApplicantsForPosting, listStages, moveApplicant, EmployerApplicantsApiError } = vi.hoisted(() => {
  class EmployerApplicantsApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) {
      super(message); this.name = 'EmployerApplicantsApiError'; this.status = status; this.code = code;
    }
  }
  return { listApplicantsForPosting: vi.fn(), listStages: vi.fn(), moveApplicant: vi.fn(), EmployerApplicantsApiError };
});

vi.mock('../../../src/api/employer-applicants-api', () => ({
  listApplicantsForPosting, listStages, moveApplicant, EmployerApplicantsApiError,
}));

import PipelineTab from '../../../src/pages/employer/Jobs/PipelineTab';
import { ToastProvider } from '../../../src/components/ui';

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Shortlisted', order: 2, isTerminal: false, isDefault: false, terminalType: null },
];

function applicant(id: string, stageId: string, archived: Applicant['application']['archived'] = null): Applicant {
  return {
    application: { id, jobId: 'j1', contactId: `c-${id}`, stageId, archived, appliedAt: 't', lastStageMovedAt: 't' },
    contact: { id: `c-${id}`, email: `${id}@x.com`, fullName: `Name ${id}`, phone: null },
    score: null,
  };
}

function renderTab() {
  return render(<ToastProvider><PipelineTab postingId="p1" /></ToastProvider>);
}

beforeEach(() => {
  listApplicantsForPosting.mockReset();
  listStages.mockReset();
  moveApplicant.mockReset();
  listStages.mockResolvedValue(STAGES);
});

describe('PipelineTab', () => {
  it('shows a skeleton while loading', async () => {
    let resolve: (value: Applicant[]) => void = () => {};
    listApplicantsForPosting.mockReturnValue(new Promise<Applicant[]>((r) => { resolve = r; }));
    const { container } = renderTab();
    expect(container.querySelector('[aria-hidden]')).not.toBeNull();
    resolve([]);
    await screen.findByText('Applied');
  });

  it('renders one column per stage', async () => {
    listApplicantsForPosting.mockResolvedValue([]);
    renderTab();
    expect(await screen.findByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Shortlisted')).toBeInTheDocument();
  });

  it('each column shows its applicant count and cards', async () => {
    listApplicantsForPosting.mockResolvedValue([applicant('a', 's1'), applicant('b', 's1'), applicant('c', 's2')]);
    renderTab();
    expect(await screen.findByText('Name a')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Applied column count
    expect(screen.getByText('1')).toBeInTheDocument(); // Shortlisted column count
  });

  it('filters archived applicants out of the board', async () => {
    listApplicantsForPosting.mockResolvedValue([applicant('a', 's1'), applicant('gone', 's1', { at: 't', reasonId: 'r1' })]);
    renderTab();
    expect(await screen.findByText('Name a')).toBeInTheDocument();
    expect(screen.queryByText('Name gone')).toBeNull();
  });

  it('shows an error Alert + Retry that reloads', async () => {
    listApplicantsForPosting.mockRejectedValueOnce(new EmployerApplicantsApiError(500, 'BOOM', 'Pipeline exploded'));
    renderTab();
    expect(await screen.findByText('Pipeline exploded')).toBeInTheDocument();
    listApplicantsForPosting.mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Applied')).toBeInTheDocument();
  });
});
