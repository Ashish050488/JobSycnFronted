// FILE: tests/pages/employer/RankedFilterBar.test.tsx
// Chunk 1, T14-T20: the filter bar's debounce, chip toggles, archived switch, and
// the conditional "Clear filters" action. Fake timers drive the 200ms debounce.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import type { Stage } from '../../../src/types/employer-applicants';
import RankedFilterBar from '../../../src/pages/employer/Jobs/RankedFilterBar';
import { createInitialRankedFilterState } from '../../../src/pages/employer/Jobs/ranked-filter-helpers';
import type { RankedFilterState, ScoreFilterValue } from '../../../src/pages/employer/Jobs/ranked-filter-helpers';

const STAGES: Stage[] = [
  { id: 's1', text: 'Screening', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Interview', order: 2, isTerminal: false, isDefault: false, terminalType: null },
];

const state = (patch: Partial<RankedFilterState> = {}): RankedFilterState =>
  ({ ...createInitialRankedFilterState(), ...patch });

function renderBar(value: RankedFilterState = createInitialRankedFilterState()) {
  const onChange = vi.fn();
  render(<RankedFilterBar value={value} stages={STAGES} onChange={onChange} />);
  return { onChange };
}

const advance = (milliseconds: number) => act(() => { vi.advanceTimersByTime(milliseconds); });
const searchBox = () => screen.getByLabelText('Search name or email');
const chip = (name: string) => screen.getByRole('button', { name });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('RankedFilterBar', () => {
  // T14
  it('propagates the search text once the 200ms debounce elapses', () => {
    const { onChange } = renderBar();
    fireEvent.change(searchBox(), { target: { value: 'asha' } });
    advance(200);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ searchText: 'asha' });
  });

  // T15
  it('does NOT propagate before the debounce elapses', () => {
    const { onChange } = renderBar();
    fireEvent.change(searchBox(), { target: { value: 'as' } });
    advance(100);
    expect(onChange).not.toHaveBeenCalled();
    advance(100);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('coalesces rapid keystrokes into a single settled onChange', () => {
    const { onChange } = renderBar();
    fireEvent.change(searchBox(), { target: { value: 'a' } });
    advance(50);
    fireEvent.change(searchBox(), { target: { value: 'as' } });
    advance(50);
    fireEvent.change(searchBox(), { target: { value: 'asha' } });
    advance(200);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].searchText).toBe('asha');
  });

  it('renders the search input with its placeholder', () => {
    renderBar();
    expect(searchBox()).toHaveAttribute('placeholder', 'Search name or email');
  });

  // T16
  it('clicking a stage chip adds that stage id', () => {
    const { onChange } = renderBar();
    fireEvent.click(chip('Screening'));
    expect([...onChange.mock.calls[0][0].stageIds]).toEqual(['s1']);
  });

  // T17
  it('clicking an already-active stage chip removes it', () => {
    const { onChange } = renderBar(state({ stageIds: new Set(['s1', 's2']) }));
    expect(chip('Screening')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(chip('Screening'));
    expect([...onChange.mock.calls[0][0].stageIds]).toEqual(['s2']);
  });

  // T18
  it('clicking a score chip toggles it on and off', () => {
    const { onChange: addChange } = renderBar();
    fireEvent.click(chip('Strong'));
    expect([...addChange.mock.calls[0][0].scoreValues]).toEqual(['strong']);
    cleanup();

    const { onChange: removeChange } = renderBar(state({ scoreValues: new Set<ScoreFilterValue>(['strong']) }));
    fireEvent.click(chip('Strong'));
    expect([...removeChange.mock.calls[0][0].scoreValues]).toEqual([]);
  });

  it('renders a chip for every tier plus Unscored', () => {
    renderBar();
    for (const label of ['Strong', 'Good', 'Partial', 'Weak', 'Poor', 'Unscored']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  // T19
  it('the Include archived switch flips the boolean', () => {
    const { onChange } = renderBar();
    fireEvent.click(screen.getByLabelText('Include archived'));
    expect(onChange.mock.calls[0][0].includeArchived).toBe(true);
  });

  // T20
  it('Clear filters is hidden with no active filter and shown once one is active', () => {
    renderBar();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
    cleanup();
    renderBar(state({ includeArchived: true }));
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('Clear filters emits a fully-reset state', () => {
    const { onChange } = renderBar(state({
      searchText: 'asha', stageIds: new Set(['s1']),
      scoreValues: new Set<ScoreFilterValue>(['strong']), includeArchived: true,
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    const next: RankedFilterState = onChange.mock.calls[0][0];
    expect(next.searchText).toBe('');
    expect(next.stageIds.size).toBe(0);
    expect(next.scoreValues.size).toBe(0);
    expect(next.includeArchived).toBe(false);
  });

  it('a stage chip shows aria-pressed reflecting its active state', () => {
    renderBar(state({ scoreValues: new Set<ScoreFilterValue>(['unscored']) }));
    expect(screen.getByRole('button', { name: 'Unscored' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Good' })).toHaveAttribute('aria-pressed', 'false');
  });
});
