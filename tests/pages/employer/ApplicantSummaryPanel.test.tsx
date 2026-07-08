// FILE: tests/pages/employer/ApplicantSummaryPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import type { ApplicantScore, Stage, ArchiveReason, StageChange } from '../../../src/types/employer-applicants';

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

import ApplicantSummaryPanel from '../../../src/pages/employer/Jobs/ApplicantSummaryPanel';

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Interview', order: 2, isTerminal: false, isDefault: false, terminalType: null },
];
const REASONS: ArchiveReason[] = [{ id: 'r1', text: 'Position filled', type: 'non-hired', status: 'active' }];

function score(overrides: Partial<ApplicantScore> = {}): ApplicantScore {
  return {
    id: 'sc1', score: 35, tier: 'weak',
    matchedSkills: ['React', 'TypeScript'], missingSkills: ['Go'], bonusSkills: ['GraphQL'],
    experienceFit: 'exp weak', locationFit: 'remote OK', noticePeriodFit: 'immediate',
    explanation: 'Junior but promising.', processedAt: 't', processingError: null,
    ...overrides,
  };
}

function change(overrides: Partial<StageChange> = {}): StageChange {
  return { id: 'x1', fromStageId: 's1', toStageId: 's2', movedByUserId: 'u1', note: null, movedAt: '2026-06-01T00:00:00Z', ...overrides };
}

function renderPanel(props: Partial<React.ComponentProps<typeof ApplicantSummaryPanel>> = {}) {
  return render(
    <ApplicantSummaryPanel
      score={score()} applicationId="a1" currentStageId="s1" archived={false}
      stages={STAGES} reasons={REASONS} stageChanges={[]} onDone={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  moveApplicant.mockReset().mockResolvedValue({});
  archiveApplicant.mockReset().mockResolvedValue({});
  unarchiveApplicant.mockReset().mockResolvedValue({});
});

describe('ApplicantSummaryPanel', () => {
  it('renders the score number and tier when a score exists', () => {
    renderPanel();
    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('weak')).toBeInTheDocument();
  });

  it('renders the tier as a coloured badge next to the score (P7.3)', () => {
    renderPanel({ score: score({ tier: 'strong' }) });
    const badge = screen.getByText('strong');
    // Badge maps strong → success; the pill carries the success token, not plain ink.
    expect(badge.getAttribute('style')).toContain('var(--success');
  });

  it('renders "Not scored yet" when score is null', () => {
    renderPanel({ score: null });
    expect(screen.getByText('Not scored yet')).toBeInTheDocument();
    expect(screen.queryByText('35')).toBeNull();
  });

  it('renders skill micro-headers with counts and coloured chips (P7.1)', () => {
    renderPanel();
    expect(screen.getByText('Matched skills · 2')).toBeInTheDocument();
    expect(screen.getByText('Missing skills · 1')).toBeInTheDocument();
    expect(screen.getByText('Bonus skills · 1')).toBeInTheDocument();
    // Each skill is its own chip element, not a dot-joined string.
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    // Regression guard: the P6 plain-text " · " join is gone.
    expect(screen.queryByText('React · TypeScript')).toBeNull();
  });

  it('renders "None" (not a stray chip) for an empty skill section', () => {
    renderPanel({ score: score({ bonusSkills: [] }) });
    expect(screen.getByText('Bonus skills · 0')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('renders the labelled one-line fit, using an em dash for null values (P7.3)', () => {
    renderPanel({ score: score({ locationFit: null }) });
    const fit = screen.getByText('Fit').parentElement;
    expect(fit).toHaveTextContent('Experience exp weak · Location — · Notice period immediate');
  });

  it('renders the summary paragraph only when explanation is present', () => {
    const { rerender } = renderPanel();
    expect(screen.getByText('Junior but promising.')).toBeInTheDocument();
    rerender(
      <ApplicantSummaryPanel
        score={score({ explanation: null })} applicationId="a1" currentStageId="s1" archived={false}
        stages={STAGES} reasons={REASONS} stageChanges={[]} onDone={vi.fn()}
      />,
    );
    expect(screen.queryByText('Junior but promising.')).toBeNull();
  });

  it('moves to the selected stage and refetches', async () => {
    const onDone = vi.fn();
    renderPanel({ onDone });
    fireEvent.change(screen.getByLabelText('Move to:'), { target: { value: 's2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move stage' }));
    await waitFor(() => expect(moveApplicant).toHaveBeenCalledWith('a1', { stageId: 's2', note: undefined }));
    expect(onDone).toHaveBeenCalled();
  });

  it('disables Move stage until the stage changes', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'Move stage' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Move to:'), { target: { value: 's2' } });
    expect(screen.getByRole('button', { name: 'Move stage' })).not.toBeDisabled();
  });

  it('archive opens a dialog; Cancel closes it; Archive confirms and refetches', async () => {
    const onDone = vi.fn();
    renderPanel({ onDone });
    fireEvent.click(screen.getByRole('button', { name: 'Archive applicant' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(archiveApplicant).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Archive applicant' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archive' }));
    await waitFor(() => expect(archiveApplicant).toHaveBeenCalledWith('a1', { reasonId: 'r1', note: undefined }));
    expect(onDone).toHaveBeenCalled();
  });

  it('shows only Unarchive when already archived (no Move/Archive)', async () => {
    const onDone = vi.fn();
    renderPanel({ archived: true, onDone });
    expect(screen.queryByRole('button', { name: 'Move stage' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Archive applicant' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Unarchive applicant' }));
    await waitFor(() => expect(unarchiveApplicant).toHaveBeenCalledWith('a1'));
    expect(onDone).toHaveBeenCalled();
  });

  it('stage history: single change → "{stage} · {time} · 1 change"', () => {
    renderPanel({ stageChanges: [change({ toStageId: 's1' })] });
    expect(screen.getByText(/^Applied · .+ · 1 change$/)).toBeInTheDocument();
  });

  it('stage history: multiple changes → "· N changes"', () => {
    renderPanel({ stageChanges: [change({ id: 'a', movedAt: '2026-06-01T00:00:00Z' }), change({ id: 'b', toStageId: 's1', movedAt: '2026-06-05T00:00:00Z' })] });
    expect(screen.getByText(/· 2 changes$/)).toBeInTheDocument();
  });

  it('stage history: empty → "No stage changes yet"', () => {
    renderPanel({ stageChanges: [] });
    expect(screen.getByText('No stage changes yet')).toBeInTheDocument();
  });

  it('surfaces an API error inline', async () => {
    moveApplicant.mockRejectedValueOnce(new EmployerApplicantsApiError(409, 'CANNOT_MOVE_ARCHIVED', 'Cannot move archived'));
    renderPanel();
    fireEvent.change(screen.getByLabelText('Move to:'), { target: { value: 's2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move stage' }));
    expect(await screen.findByText('Cannot move archived')).toBeInTheDocument();
  });
});
