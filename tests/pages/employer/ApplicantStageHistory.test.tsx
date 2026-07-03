// FILE: tests/pages/employer/ApplicantStageHistory.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ApplicantStageHistory from '../../../src/pages/employer/Jobs/ApplicantStageHistory';
import type { Stage, StageChange } from '../../../src/types/employer-applicants';

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Interview', order: 2, isTerminal: false, isDefault: false, terminalType: null },
];

function change(overrides: Partial<StageChange> = {}): StageChange {
  return { id: 'x1', fromStageId: 's1', toStageId: 's2', movedByUserId: 'u1', note: null, movedAt: '2026-06-01T00:00:00Z', ...overrides };
}

describe('ApplicantStageHistory', () => {
  it('shows an empty state when there are no changes', () => {
    render(<ApplicantStageHistory stageChanges={[]} stages={STAGES} />);
    expect(screen.getByText('No stage changes yet.')).toBeInTheDocument();
  });

  it('renders newest-first with a from → to transition', () => {
    const older = change({ id: 'a', movedAt: '2026-06-01T00:00:00Z' });
    const newer = change({ id: 'b', fromStageId: 's2', toStageId: 's1', movedAt: '2026-06-05T00:00:00Z' });
    render(<ApplicantStageHistory stageChanges={[older, newer]} stages={STAGES} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Interview → Applied'); // newer first
    expect(rows[1]).toHaveTextContent('Applied → Interview');
  });

  it('styles an "Archived:" row distinctly (danger colour) and shows its note as the title', () => {
    const archived = change({ id: 'arch', fromStageId: 's2', toStageId: 's2', note: 'Archived: Position filled' });
    render(<ApplicantStageHistory stageChanges={[archived]} stages={STAGES} />);
    const title = screen.getByText('Archived: Position filled');
    expect(title).toBeInTheDocument();
    expect(title.getAttribute('style')).toContain('var(--danger)');
  });
});
