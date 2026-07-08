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

describe('ApplicantStageHistory', () => {
  it('zero changes → "No stage changes yet.", no expand button (P4.4)', () => {
    render(<ApplicantStageHistory stageChanges={[]} stages={STAGES} />);
    expect(screen.getByText('No stage changes yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('one change → compact one-line summary, no expand button (P4.4)', () => {
    render(<ApplicantStageHistory stageChanges={[change({ id: 'a' })]} stages={STAGES} />);
    // latest toStageId=s2 → "Interview"; no button because there is nothing extra.
    expect(screen.getByText(/Interview ·/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('multiple changes → one-line summary plus a "2 more changes" expand button', () => {
    const older = change({ id: 'a', movedAt: '2026-06-01T00:00:00Z' });
    const mid = change({ id: 'b', movedAt: '2026-06-03T00:00:00Z' });
    const newer = change({ id: 'c', fromStageId: 's2', toStageId: 's1', movedAt: '2026-06-05T00:00:00Z' });
    render(<ApplicantStageHistory stageChanges={[older, mid, newer]} stages={STAGES} />);
    const trigger = screen.getByRole('button', { name: '2 more changes' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0); // list not in DOM until opened
  });

  it('click expand → all rows render newest-first, click again collapses', () => {
    const older = change({ id: 'a', movedAt: '2026-06-01T00:00:00Z' });
    const newer = change({ id: 'b', fromStageId: 's2', toStageId: 's1', movedAt: '2026-06-05T00:00:00Z' });
    render(<ApplicantStageHistory stageChanges={[older, newer]} stages={STAGES} />);
    const trigger = screen.getByRole('button', { name: '1 more change' });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Interview → Applied'); // newer first
    expect(rows[1]).toHaveTextContent('Applied → Interview');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('styles an "Archived:" row distinctly (danger colour) when expanded', () => {
    const archived = change({ id: 'arch', fromStageId: 's2', toStageId: 's2', note: 'Archived: Position filled', movedAt: '2026-06-05T00:00:00Z' });
    const earlier = change({ id: 'a', movedAt: '2026-06-01T00:00:00Z' });
    render(<ApplicantStageHistory stageChanges={[earlier, archived]} stages={STAGES} />);
    fireEvent.click(screen.getByRole('button', { name: '1 more change' }));
    const title = screen.getByText('Archived: Position filled');
    expect(title.getAttribute('style')).toContain('var(--danger)');
  });
});
