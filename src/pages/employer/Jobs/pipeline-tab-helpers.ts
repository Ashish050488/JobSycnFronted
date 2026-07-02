// FILE: src/pages/employer/Jobs/pipeline-tab-helpers.ts
// Pure state transforms for the Kanban board (R3/R6). Extracted from PipelineTab so
// the move logic is unit-testable without simulating pointer events. The board
// state is a Map<stageId, Applicant[]>; moves remove the card from its source
// column and append it to the target (arrival order, no per-card ordering — R3).

import type { Applicant, Stage } from '../../../types/employer-applicants';

/** Group non-archived applicants by their stageId; every stage gets an entry (R3). */
export function groupApplicantsByStage(applicants: Applicant[], stages: Stage[]): Map<string, Applicant[]> {
  const byStage = new Map<string, Applicant[]>();
  for (const stage of stages) byStage.set(stage.id, []);
  for (const applicant of applicants) {
    if (applicant.application.archived) continue; // archived cards stay out of the board
    const stageId = applicant.application.stageId;
    if (!byStage.has(stageId)) byStage.set(stageId, []);
    byStage.get(stageId)!.push(applicant);
  }
  return byStage;
}

/** Find one applicant across every column by its application id. */
export function findApplicantById(byStage: Map<string, Applicant[]>, applicationId: string): Applicant | null {
  for (const applicants of byStage.values()) {
    const found = applicants.find((applicant) => applicant.application.id === applicationId);
    if (found) return found;
  }
  return null;
}

/**
 * Return a new map with `applicant` removed from its current column and appended to
 * `targetStageId`, its stageId updated. A no-op (returns the same map) when the
 * applicant is already in the target column.
 */
export function moveApplicantInMap(
  byStage: Map<string, Applicant[]>,
  applicant: Applicant,
  targetStageId: string,
): Map<string, Applicant[]> {
  if (applicant.application.stageId === targetStageId) return byStage;
  const next = new Map<string, Applicant[]>();
  for (const [stageId, applicants] of byStage) {
    next.set(stageId, applicants.filter((entry) => entry.application.id !== applicant.application.id));
  }
  if (!next.has(targetStageId)) next.set(targetStageId, []);
  const moved: Applicant = {
    ...applicant,
    application: { ...applicant.application, stageId: targetStageId },
  };
  next.set(targetStageId, [...next.get(targetStageId)!, moved]);
  return next;
}
