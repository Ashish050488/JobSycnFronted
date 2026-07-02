// FILE: tests/pages/employer/pipeline-tab-helpers.test.ts
import { describe, it, expect } from 'vitest';
import {
  groupApplicantsByStage, findApplicantById, moveApplicantInMap,
} from '../../../src/pages/employer/Jobs/pipeline-tab-helpers';
import type { Applicant, Stage } from '../../../src/types/employer-applicants';

const STAGES: Stage[] = [
  { id: 's1', text: 'Applied', order: 1, isTerminal: false, isDefault: true, terminalType: null },
  { id: 's2', text: 'Shortlisted', order: 2, isTerminal: false, isDefault: false, terminalType: null },
];

function applicant(id: string, stageId: string, archived: Applicant['application']['archived'] = null): Applicant {
  return {
    application: { id, jobId: 'j1', contactId: `c-${id}`, stageId, archived, appliedAt: 't', lastStageMovedAt: 't' },
    contact: { id: `c-${id}`, email: `${id}@x.com`, fullName: id, phone: null },
    score: null,
  };
}

describe('pipeline-tab-helpers', () => {
  it('groupApplicantsByStage buckets by stageId and gives every stage an entry', () => {
    const grouped = groupApplicantsByStage([applicant('a', 's1'), applicant('b', 's2')], STAGES);
    expect(grouped.get('s1')!.map((entry) => entry.application.id)).toEqual(['a']);
    expect(grouped.get('s2')!.map((entry) => entry.application.id)).toEqual(['b']);
  });

  it('groupApplicantsByStage filters out archived applicants', () => {
    const grouped = groupApplicantsByStage([applicant('a', 's1'), applicant('b', 's1', { at: 't', reasonId: 'r1' })], STAGES);
    expect(grouped.get('s1')!.map((entry) => entry.application.id)).toEqual(['a']);
  });

  it('findApplicantById searches across all columns', () => {
    const grouped = groupApplicantsByStage([applicant('a', 's1'), applicant('b', 's2')], STAGES);
    expect(findApplicantById(grouped, 'b')!.application.id).toBe('b');
    expect(findApplicantById(grouped, 'nope')).toBeNull();
  });

  it('moveApplicantInMap removes from source, appends to target, updates stageId', () => {
    const grouped = groupApplicantsByStage([applicant('a', 's1')], STAGES);
    const moved = moveApplicantInMap(grouped, findApplicantById(grouped, 'a')!, 's2');
    expect(moved.get('s1')).toEqual([]);
    expect(moved.get('s2')!.map((entry) => entry.application.id)).toEqual(['a']);
    expect(moved.get('s2')![0].application.stageId).toBe('s2');
  });

  it('moveApplicantInMap is a no-op when target === source', () => {
    const grouped = groupApplicantsByStage([applicant('a', 's1')], STAGES);
    const moved = moveApplicantInMap(grouped, findApplicantById(grouped, 'a')!, 's1');
    expect(moved).toBe(grouped); // same reference — no state churn
  });
});
