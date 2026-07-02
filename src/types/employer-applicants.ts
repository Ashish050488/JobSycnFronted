// FILE: src/types/employer-applicants.ts
// Shapes for the employer applicant pipeline (Ranked + Kanban tabs). Mirrors the
// 7A/Step-6 backend responses: getApplicantDetail / listApplicants / listStages /
// listArchiveReasons. Kept minimal — only the fields the pipeline UI consumes.

export type ScoreTier = 'strong' | 'good' | 'partial' | 'weak' | 'poor';

export interface ApplicantScore {
  id: string;
  score: number;
  tier: ScoreTier;
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string | null;
  processedAt: string | null;
  processingError: string | null;
}

export interface Applicant {
  application: {
    id: string;
    jobId: string;
    contactId: string;
    stageId: string;
    archived: { at: string; reasonId: string; note?: string } | null;
    appliedAt: string;
    lastStageMovedAt: string;
  };
  contact: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
  } | null;
  score: ApplicantScore | null;
}

export interface Stage {
  id: string;
  text: string;
  order: number;
  isTerminal: boolean;
  isDefault: boolean;
  terminalType: 'hired' | null;
}

export interface ArchiveReason {
  id: string;
  text: string;
  type: 'hired' | 'non-hired';
  status: string;
}

export type ApplicantSort = 'score' | 'date';
