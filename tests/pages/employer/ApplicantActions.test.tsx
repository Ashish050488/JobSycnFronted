// FILE: tests/pages/employer/ApplicantActions.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Stage, ArchiveReason } from '../../../src/types/employer-applicants';

const { moveApplicant, archiveApplicant, unarchiveApplicant, EmployerApplicantsApiError } = vi.hoisted(() => {
  class EmployerApplicantsApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) {
      super(message); this.status = status; this.code = code;
    }
  }
  return { moveApplicant: vi.fn(), archiveApplicant: vi.fn(), unarchiveApplicant: vi.fn(), EmployerApplicantsApiError };
});

vi.mock('../../../src/api/employer-applicants-api', () => ({
  moveApplicant, archiveApplicant, unarchiveApplicant, EmployerApplicantsApiError,
}));

import ApplicantActions from '../../../src/pages/employer/Jobs/ApplicantActions';

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Interview', order: 2, isTerminal: false, isDefault: false, terminalType: null },
];
const REASONS: ArchiveReason[] = [
  { id: 'r1', text: 'Position filled', type: 'non-hired', status: 'active' },
];

function renderActions(archived = false, onDone = vi.fn()) {
  return render(
    <ApplicantActions
      applicationId="a1" currentStageId="s1" archived={archived}
      stages={STAGES} reasons={REASONS} onDone={onDone}
    />,
  );
}

beforeEach(() => {
  moveApplicant.mockReset(); archiveApplicant.mockReset(); unarchiveApplicant.mockReset();
  moveApplicant.mockResolvedValue({}); archiveApplicant.mockResolvedValue({}); unarchiveApplicant.mockResolvedValue({});
});

describe('ApplicantActions', () => {
  it('moves to the selected stage and refetches', async () => {
    const onDone = vi.fn();
    renderActions(false, onDone);
    fireEvent.change(screen.getByLabelText('Move to stage'), { target: { value: 's2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move stage' }));
    await waitFor(() => expect(moveApplicant).toHaveBeenCalledWith('a1', { stageId: 's2', note: undefined }));
    expect(onDone).toHaveBeenCalled();
  });

  it('archives only after confirming in the modal', async () => {
    const onDone = vi.fn();
    renderActions(false, onDone);
    expect(archiveApplicant).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Archive applicant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm archive' }));
    await waitFor(() => expect(archiveApplicant).toHaveBeenCalledWith('a1', { reasonId: 'r1', note: undefined }));
    expect(onDone).toHaveBeenCalled();
  });

  it('shows only Unarchive when archived', async () => {
    const onDone = vi.fn();
    renderActions(true, onDone);
    expect(screen.queryByRole('button', { name: 'Move stage' })).toBeNull();
    const button = screen.getByRole('button', { name: 'Unarchive applicant' });
    fireEvent.click(button);
    await waitFor(() => expect(unarchiveApplicant).toHaveBeenCalledWith('a1'));
    expect(onDone).toHaveBeenCalled();
  });

  it('surfaces an API error inline', async () => {
    moveApplicant.mockRejectedValueOnce(new EmployerApplicantsApiError(409, 'CANNOT_MOVE_ARCHIVED', 'Cannot move archived'));
    renderActions();
    fireEvent.change(screen.getByLabelText('Move to stage'), { target: { value: 's2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move stage' }));
    expect(await screen.findByText('Cannot move archived')).toBeInTheDocument();
  });
});
