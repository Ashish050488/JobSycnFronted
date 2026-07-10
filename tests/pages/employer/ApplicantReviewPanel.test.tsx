// FILE: tests/pages/employer/ApplicantReviewPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import type { ApplicantScore, Stage, ArchiveReason, StageChange, ScoreJobStatus } from '../../../src/types/employer-applicants';

const { moveApplicant, archiveApplicant, unarchiveApplicant, rescoreApplicant, EmployerApplicantsApiError } = vi.hoisted(() => {
  class EmployerApplicantsApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { moveApplicant: vi.fn(), archiveApplicant: vi.fn(), unarchiveApplicant: vi.fn(), rescoreApplicant: vi.fn(), EmployerApplicantsApiError };
});

vi.mock('../../../src/api/employer-applicants-api', () => ({ moveApplicant, archiveApplicant, unarchiveApplicant, rescoreApplicant, EmployerApplicantsApiError }));

import ApplicantReviewPanel from '../../../src/pages/employer/Jobs/ApplicantReviewPanel';

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Interview', order: 2, isTerminal: false, isDefault: false, terminalType: null },
];
const REASONS: ArchiveReason[] = [{ id: 'r1', text: 'Position filled', type: 'non-hired', status: 'active' }];

function score(overrides: Partial<ApplicantScore> = {}): ApplicantScore {
  return {
    id: 'sc1', score: 35, tier: 'weak',
    matchedSkills: ['React'], missingSkills: ['Go'], bonusSkills: ['GraphQL'],
    experienceFit: '3 yrs', locationFit: 'Remote', noticePeriodFit: 'Immediate',
    explanation: 'Junior but promising.', processedAt: 't', processingError: null, ...overrides,
  };
}
function change(o: Partial<StageChange> = {}): StageChange {
  return { id: 'x1', fromStageId: 's1', toStageId: 's2', movedByUserId: 'u1', note: null, movedAt: '2026-06-01T00:00:00Z', ...o };
}
function renderPanel(props: Partial<React.ComponentProps<typeof ApplicantReviewPanel>> = {}) {
  return render(
    <ApplicantReviewPanel
      score={score()} applicationId="a1" currentStageId="s1" archived={false}
      stages={STAGES} reasons={REASONS} stageChanges={[]} onDone={vi.fn()} {...props}
    />,
  );
}

function jobStatus(status: ScoreJobStatus['status']): ScoreJobStatus {
  return { jobId: 'j1', status, attemptCount: 0, errorCode: null, nextTryAt: null, completedAt: null };
}
const rescoreButton = () => screen.getByRole('button', { name: /^Rescor(e|ing…)$/ });

beforeEach(() => {
  moveApplicant.mockReset().mockResolvedValue({});
  archiveApplicant.mockReset().mockResolvedValue({});
  unarchiveApplicant.mockReset().mockResolvedValue({});
  rescoreApplicant.mockReset().mockResolvedValue({ rescored: true, jobStatus: 'queued', jobId: 'j1', attemptCount: 0 });
});

describe('ApplicantReviewPanel', () => {
  it('renders the score hero, tier and fit tiles', () => {
    renderPanel();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
    expect(screen.getByText('weak')).toBeInTheDocument();
    expect(screen.getByText('3 yrs')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('renders "Not scored yet" and hides skills/fit when score is null', () => {
    renderPanel({ score: null });
    expect(screen.getByText('Not scored yet')).toBeInTheDocument();
    expect(screen.queryByText('Experience')).toBeNull();
  });

  it('renders coloured skill chips per bucket', () => {
    renderPanel();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
  });

  it('renders the summary when present, hides it when absent', () => {
    const { rerender } = renderPanel();
    expect(screen.getByText('Junior but promising.')).toBeInTheDocument();
    rerender(
      <ApplicantReviewPanel score={score({ explanation: null })} applicationId="a1" currentStageId="s1"
        archived={false} stages={STAGES} reasons={REASONS} stageChanges={[]} onDone={vi.fn()} />,
    );
    expect(screen.queryByText('Junior but promising.')).toBeNull();
  });

  it('moves to the selected stage with the move note and refetches', async () => {
    const onDone = vi.fn();
    renderPanel({ onDone });
    fireEvent.change(screen.getByLabelText('Move to'), { target: { value: 's2' } });
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'strong fit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move stage' }));
    await waitFor(() => expect(moveApplicant).toHaveBeenCalledWith('a1', { stageId: 's2', note: 'strong fit' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('disables Move stage until the stage changes', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'Move stage' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Move to'), { target: { value: 's2' } });
    expect(screen.getByRole('button', { name: 'Move stage' })).not.toBeDisabled();
  });

  it('the archive dialog note is independent of the move note (regression: no note leak)', async () => {
    renderPanel();
    // Type a move note, then open Archive — the dialog note must start empty.
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'move-context note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByLabelText('Note (optional)')).toHaveValue('');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm archive' }));
    await waitFor(() => expect(archiveApplicant).toHaveBeenCalledWith('a1', { reasonId: 'r1', note: undefined }));
  });

  it('shows only Unarchive when already archived', async () => {
    const onDone = vi.fn();
    renderPanel({ archived: true, onDone });
    expect(screen.queryByRole('button', { name: 'Move stage' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Unarchive applicant' }));
    await waitFor(() => expect(unarchiveApplicant).toHaveBeenCalledWith('a1'));
  });

  it('history footer: single vs multiple vs empty', () => {
    const { rerender } = renderPanel({ stageChanges: [change({ toStageId: 's1' })] });
    expect(screen.getByText(/^Applied · .+ · 1 change$/)).toBeInTheDocument();
    rerender(
      <ApplicantReviewPanel score={score()} applicationId="a1" currentStageId="s1" archived={false}
        stages={STAGES} reasons={REASONS} onDone={vi.fn()}
        stageChanges={[change({ id: 'a', movedAt: '2026-06-01T00:00:00Z' }), change({ id: 'b', toStageId: 's1', movedAt: '2026-06-05T00:00:00Z' })]} />,
    );
    expect(screen.getByText(/· 2 changes$/)).toBeInTheDocument();
  });

  it('surfaces an API error inline', async () => {
    moveApplicant.mockRejectedValueOnce(new EmployerApplicantsApiError(409, 'X', 'Cannot move archived'));
    renderPanel();
    fireEvent.change(screen.getByLabelText('Move to'), { target: { value: 's2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move stage' }));
    expect(await screen.findByText('Cannot move archived')).toBeInTheDocument();
  });

  // ---- Rescore (T1.2 D16) ------------------------------------------------

  // D16(q)
  it('shows an enabled Rescore button when no score job exists', () => {
    renderPanel({ scoreJobStatus: null });
    const button = rescoreButton();
    expect(button).toHaveTextContent('Rescore');
    expect(button).not.toBeDisabled();
    expect(screen.queryByText('Rescoring…')).toBeNull();
  });

  it('offers Rescore even when the applicant was never scored', () => {
    renderPanel({ score: null, scoreJobStatus: null });
    expect(screen.getByText('Not scored yet')).toBeInTheDocument();
    expect(rescoreButton()).not.toBeDisabled();
  });

  // D16(r)
  it('disables the button and labels it "Rescoring…" while the job is queued', () => {
    renderPanel({ scoreJobStatus: jobStatus('queued') });
    expect(rescoreButton()).toBeDisabled();
    expect(rescoreButton()).toHaveTextContent('Rescoring…');
  });

  it('is also in-flight while the job is processing, but idle for done/failed', () => {
    const { rerender } = renderPanel({ scoreJobStatus: jobStatus('processing') });
    expect(rescoreButton()).toBeDisabled();
    for (const status of ['done', 'failed'] as const) {
      rerender(
        <ApplicantReviewPanel score={score()} scoreJobStatus={jobStatus(status)} applicationId="a1"
          currentStageId="s1" archived={false} stages={STAGES} reasons={REASONS} stageChanges={[]} onDone={vi.fn()} />,
      );
      expect(rescoreButton()).not.toBeDisabled();
    }
  });

  // D16(s)
  it('clicking Rescore calls rescoreApplicant then refetches via onDone', async () => {
    const onDone = vi.fn();
    renderPanel({ onDone, scoreJobStatus: null });
    fireEvent.click(rescoreButton());
    await waitFor(() => expect(rescoreApplicant).toHaveBeenCalledWith('a1'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  // D16(t)
  it('an error from rescoreApplicant surfaces inline and re-enables the button', async () => {
    rescoreApplicant.mockRejectedValueOnce(new EmployerApplicantsApiError(500, 'RESCORE_ENQUEUE_FAILED', 'Could not queue a rescore.'));
    const onDone = vi.fn();
    renderPanel({ onDone, scoreJobStatus: null });
    fireEvent.click(rescoreButton());
    expect(await screen.findByText('Could not queue a rescore.')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    await waitFor(() => expect(rescoreButton()).not.toBeDisabled());
  });

  // D16(u) — regression: never blank the score mid-rescore (C13).
  it('keeps the score number, tier badge and skills visible while rescoring', () => {
    renderPanel({ scoreJobStatus: jobStatus('queued') });
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
    expect(screen.getByText('weak')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Junior but promising.')).toBeInTheDocument();
    expect(screen.getByText('Rescoring…', { selector: 'span' })).toBeInTheDocument();
  });
});
