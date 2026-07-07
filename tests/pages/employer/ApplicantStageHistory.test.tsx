// FILE: tests/pages/employer/ApplicantStageHistory.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ApplicantStageHistory from '../../../src/pages/employer/Jobs/ApplicantStageHistory';
import type { Stage, StageChange } from '../../../src/types/employer-applicants';

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Interview', order: 2, isTerminal: false, isDefault: false, terminalType: null },
];

function change(overrides: Partial<StageChange> = {}): StageChange {
  return { id: 'x1', fromStageId: 's1', toStageId: 's2', movedByUserId: 'u1', note: null, movedAt: '2026-06-01T00:00:00Z', ...overrides };
}

const expand = () => fireEvent.click(screen.getByRole('button', { name: /Stage history/ }));

describe('ApplicantStageHistory', () => {
  it('empty history → trigger says "No entries yet", collapsed by default (P3.2)', () => {
    render(<ApplicantStageHistory stageChanges={[]} stages={STAGES} />);
    const trigger = screen.getByRole('button', { name: /Stage history/ });
    expect(trigger).toHaveTextContent(/No entries yet/);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('No stage changes yet.')).toBeNull();
    expand();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('No stage changes yet.')).toBeInTheDocument();
  });

  it('non-empty history → trigger shows the count (P3.2)', () => {
    render(<ApplicantStageHistory stageChanges={[change({ id: 'a' }), change({ id: 'b' })]} stages={STAGES} />);
    expect(screen.getByRole('button', { name: /Stage history/ })).toHaveTextContent(/· 2/);
  });

  it('renders newest-first with a from → to transition once expanded', () => {
    const older = change({ id: 'a', movedAt: '2026-06-01T00:00:00Z' });
    const newer = change({ id: 'b', fromStageId: 's2', toStageId: 's1', movedAt: '2026-06-05T00:00:00Z' });
    render(<ApplicantStageHistory stageChanges={[older, newer]} stages={STAGES} />);
    expect(screen.queryAllByRole('listitem')).toHaveLength(0); // collapsed
    expand();
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Interview → Applied'); // newer first
    expect(rows[1]).toHaveTextContent('Applied → Interview');
  });

  it('styles an "Archived:" row distinctly (danger colour) when expanded', () => {
    const archived = change({ id: 'arch', fromStageId: 's2', toStageId: 's2', note: 'Archived: Position filled' });
    render(<ApplicantStageHistory stageChanges={[archived]} stages={STAGES} />);
    expand();
    const title = screen.getByText('Archived: Position filled');
    expect(title.getAttribute('style')).toContain('var(--danger)');
  });

  it('collapses again on a second click (content unmounted)', () => {
    render(<ApplicantStageHistory stageChanges={[change({ id: 'a' })]} stages={STAGES} />);
    expand();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expand();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
