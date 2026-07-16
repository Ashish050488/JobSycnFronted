// FILE: tests/pages/employer/ranked-filter-helpers.test.ts
// Pure-function tests for the Ranked tab client-side filter (Chunk 1, T1-T13).
import { describe, it, expect } from 'vitest';
import type { Applicant, ApplicantScore } from '../../../src/types/employer-applicants';
import {
  filterRankedApplicants, deriveScoreBucket, createInitialRankedFilterState,
  isRankedFilterActive, toggleSetValue,
} from '../../../src/pages/employer/Jobs/ranked-filter-helpers';
import type { RankedFilterState, ScoreFilterValue } from '../../../src/pages/employer/Jobs/ranked-filter-helpers';

function score(overrides: Partial<ApplicantScore> = {}): ApplicantScore {
  return {
    id: 'sc1', score: 82, tier: 'good', matchedSkills: [], missingSkills: [],
    explanation: null, processedAt: 't', processingError: null, ...overrides,
  };
}

function applicant(overrides: {
  id?: string; fullName?: string; email?: string; stageId?: string;
  archived?: Applicant['application']['archived'];
  score?: ApplicantScore | null; contact?: Applicant['contact'];
} = {}): Applicant {
  const id = overrides.id ?? 'a1';
  return {
    application: {
      id, jobId: 'j1', contactId: `c-${id}`, stageId: overrides.stageId ?? 's1',
      archived: overrides.archived ?? null, appliedAt: '2026-06-01T00:00:00Z',
      coverNote: null, lastStageMovedAt: '2026-06-01T00:00:00Z',
    },
    // Email defaults off the id so a name-only search can never match via email.
    contact: overrides.contact !== undefined ? overrides.contact : {
      id: `c-${id}`, email: overrides.email ?? `${id}@example.com`,
      fullName: overrides.fullName ?? 'Asha Rao', phone: null,
    },
    score: overrides.score !== undefined ? overrides.score : score(),
  };
}

const state = (patch: Partial<RankedFilterState> = {}): RankedFilterState =>
  ({ ...createInitialRankedFilterState(), ...patch });
const ids = (list: Applicant[]) => list.map((item) => item.application.id);
const setOf = <T,>(...values: T[]) => new Set<T>(values);

describe('filterRankedApplicants', () => {
  // T1
  it('returns the input content unchanged under an empty filter state', () => {
    const input = [applicant({ id: 'a1' }), applicant({ id: 'a2' })];
    const result = filterRankedApplicants(input, createInitialRankedFilterState());
    expect(result).toEqual(input);
    expect(result).not.toBe(input); // new array, input untouched
  });

  // T2
  it('matches searchText against the contact name, case-insensitively', () => {
    const list = [applicant({ id: 'a1', fullName: 'Asha Rao' }), applicant({ id: 'a2', fullName: 'Bilal Khan' })];
    expect(ids(filterRankedApplicants(list, state({ searchText: 'aSHa' })))).toEqual(['a1']);
    expect(ids(filterRankedApplicants(list, state({ searchText: 'KHAN' })))).toEqual(['a2']);
  });

  // T3
  it('matches searchText against the contact email, case-insensitively', () => {
    const list = [applicant({ id: 'a1', email: 'asha@example.com' }), applicant({ id: 'a2', email: 'bilal@other.io' })];
    expect(ids(filterRankedApplicants(list, state({ searchText: 'OTHER.IO' })))).toEqual(['a2']);
  });

  // T4
  it('treats a whitespace-only searchText as no search filter', () => {
    const list = [applicant({ id: 'a1' }), applicant({ id: 'a2' })];
    expect(ids(filterRankedApplicants(list, state({ searchText: '   ' })))).toEqual(['a1', 'a2']);
    expect(ids(filterRankedApplicants(list, state({ searchText: '\t\n ' })))).toEqual(['a1', 'a2']);
  });

  // T5
  it('excludes a null-contact applicant when searchText is non-empty', () => {
    const list = [applicant({ id: 'a1' }), applicant({ id: 'a2', contact: null })];
    expect(ids(filterRankedApplicants(list, state({ searchText: 'asha' })))).toEqual(['a1']);
    // …but keeps it when there is no search term.
    expect(ids(filterRankedApplicants(list, createInitialRankedFilterState()))).toEqual(['a1', 'a2']);
  });

  // T6
  it('keeps only applicants in a single selected stage', () => {
    const list = [applicant({ id: 'a1', stageId: 's1' }), applicant({ id: 'a2', stageId: 's2' })];
    expect(ids(filterRankedApplicants(list, state({ stageIds: setOf('s2') })))).toEqual(['a2']);
  });

  // T7
  it('ORs within the stage axis and ANDs across axes', () => {
    const list = [
      applicant({ id: 'a1', stageId: 's1', fullName: 'Asha' }),
      applicant({ id: 'a2', stageId: 's2', fullName: 'Bilal' }),
      applicant({ id: 'a3', stageId: 's3', fullName: 'Asha Two' }),
    ];
    expect(ids(filterRankedApplicants(list, state({ stageIds: setOf('s1', 's2') })))).toEqual(['a1', 'a2']);
    // OR across s1|s3, AND with name search "asha" → a1 and a3.
    expect(ids(filterRankedApplicants(list, state({ stageIds: setOf('s1', 's3'), searchText: 'asha' })))).toEqual(['a1', 'a3']);
  });

  // T8
  it('keeps only the selected score tier', () => {
    const list = [
      applicant({ id: 'a1', score: score({ tier: 'strong', score: 90 }) }),
      applicant({ id: 'a2', score: score({ tier: 'good', score: 70 }) }),
    ];
    expect(ids(filterRankedApplicants(list, state({ scoreValues: setOf<ScoreFilterValue>('strong') })))).toEqual(['a1']);
  });

  // T9
  it("'unscored' captures null score, processingError, and a null numeric score", () => {
    const list = [
      applicant({ id: 'nullScore', score: null }),
      applicant({ id: 'errored', score: score({ processingError: 'GEMMA_UNAVAILABLE' }) }),
      applicant({ id: 'nullNumber', score: score({ score: null as unknown as number }) }),
      applicant({ id: 'scored', score: score({ tier: 'good' }) }),
    ];
    const result = filterRankedApplicants(list, state({ scoreValues: setOf<ScoreFilterValue>('unscored') }));
    expect(ids(result)).toEqual(['nullScore', 'errored', 'nullNumber']);
  });

  // T10
  it('excludes archived applicants by default', () => {
    const list = [applicant({ id: 'a1' }), applicant({ id: 'a2', archived: { at: 't', reasonId: 'r1' } })];
    expect(ids(filterRankedApplicants(list, createInitialRankedFilterState()))).toEqual(['a1']);
  });

  // T11
  it('includes archived + active when includeArchived is true', () => {
    const list = [applicant({ id: 'a1' }), applicant({ id: 'a2', archived: { at: 't', reasonId: 'r1' } })];
    expect(ids(filterRankedApplicants(list, state({ includeArchived: true })))).toEqual(['a1', 'a2']);
  });

  // T12
  it('AND-combines search + stage + score + archived', () => {
    const list = [
      applicant({ id: 'hit', fullName: 'Asha Rao', stageId: 's1', score: score({ tier: 'strong' }), archived: { at: 't', reasonId: 'r1' } }),
      applicant({ id: 'wrongName', fullName: 'Bilal', stageId: 's1', score: score({ tier: 'strong' }), archived: { at: 't', reasonId: 'r1' } }),
      applicant({ id: 'wrongStage', fullName: 'Asha Rao', stageId: 's9', score: score({ tier: 'strong' }), archived: { at: 't', reasonId: 'r1' } }),
      applicant({ id: 'wrongTier', fullName: 'Asha Rao', stageId: 's1', score: score({ tier: 'weak' }), archived: { at: 't', reasonId: 'r1' } }),
      applicant({ id: 'notArchived', fullName: 'Asha Rao', stageId: 's1', score: score({ tier: 'strong' }), archived: null }),
    ];
    const result = filterRankedApplicants(list, state({
      searchText: 'asha', stageIds: setOf('s1'),
      scoreValues: setOf<ScoreFilterValue>('strong'), includeArchived: true,
    }));
    expect(ids(result)).toEqual(['hit', 'notArchived']); // includeArchived widens, never requires
  });

  it('is order-independent and never mutates its input', () => {
    const list = [applicant({ id: 'a1', stageId: 's1' }), applicant({ id: 'a2', stageId: 's2' })];
    const snapshot = JSON.stringify(list);
    filterRankedApplicants(list, state({ searchText: 'asha', stageIds: setOf('s1') }));
    expect(JSON.stringify(list)).toBe(snapshot);
  });
});

// T13
describe('deriveScoreBucket', () => {
  it("returns 'unscored' for a null score", () => {
    expect(deriveScoreBucket(applicant({ score: null }))).toBe('unscored');
  });
  it("returns 'unscored' for a truthy processingError", () => {
    expect(deriveScoreBucket(applicant({ score: score({ processingError: 'BOOM' }) }))).toBe('unscored');
  });
  it("returns 'unscored' when score.score is null", () => {
    expect(deriveScoreBucket(applicant({ score: score({ score: null as unknown as number }) }))).toBe('unscored');
  });
  it('returns the tier for a usable score', () => {
    expect(deriveScoreBucket(applicant({ score: score({ tier: 'partial' }) }))).toBe('partial');
    expect(deriveScoreBucket(applicant({ score: score({ tier: 'poor', score: 0 }) }))).toBe('poor');
  });
});

describe('filter-state helpers', () => {
  it('createInitialRankedFilterState returns fresh, unshared Sets', () => {
    const first = createInitialRankedFilterState();
    const second = createInitialRankedFilterState();
    expect(first.stageIds).not.toBe(second.stageIds);
    expect(isRankedFilterActive(first)).toBe(false);
  });

  it('isRankedFilterActive detects each axis independently', () => {
    expect(isRankedFilterActive(state({ searchText: 'x' }))).toBe(true);
    expect(isRankedFilterActive(state({ searchText: '  ' }))).toBe(false);
    expect(isRankedFilterActive(state({ stageIds: setOf('s1') }))).toBe(true);
    expect(isRankedFilterActive(state({ scoreValues: setOf<ScoreFilterValue>('good') }))).toBe(true);
    expect(isRankedFilterActive(state({ includeArchived: true }))).toBe(true);
  });

  it('toggleSetValue adds, removes, and never mutates the source', () => {
    const source = setOf('a');
    expect([...toggleSetValue(source, 'b')].sort()).toEqual(['a', 'b']);
    expect([...toggleSetValue(source, 'a')]).toEqual([]);
    expect([...source]).toEqual(['a']);
  });
});
