// FILE: src/api/employer-applicants-api.ts
// Typed client for the employer applicant pipeline endpoints. Every call sends the
// employer auth cookie and throws EmployerApplicantsApiError (status + code) on any
// non-2xx. Pipeline/Ranked pages call only this module — never fetch() directly.

import type {
  Applicant, ApplicantDetail, ResumeUrl, Stage, ArchiveReason, ApplicantSort, BulkArchiveResult,
} from '../types/employer-applicants';

export class EmployerApplicantsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerApplicantsApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerApplicantsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

const applicantPath = (applicationId: string) => `/api/employer/applicants/${encodeURIComponent(applicationId)}`;

export async function listApplicantsForPosting(
  postingId: string,
  { sort }: { sort?: ApplicantSort } = {},
): Promise<Applicant[]> {
  const query = sort ? `?sort=${encodeURIComponent(sort)}` : '';
  const body = await request<{ applicants: Applicant[] }>(
    `/api/employer/jobs/${encodeURIComponent(postingId)}/applicants${query}`,
  );
  return body.applicants;
}

export async function fetchApplicantDetail(applicationId: string): Promise<ApplicantDetail> {
  const body = await request<{ applicant: ApplicantDetail }>(applicantPath(applicationId));
  return body.applicant;
}

export async function refreshResumeUrl(applicationId: string): Promise<ResumeUrl> {
  return request<ResumeUrl>(`${applicantPath(applicationId)}/resume-url`);
}

export async function listStages(): Promise<Stage[]> {
  const body = await request<{ stages: Stage[] }>('/api/employer/stages');
  return body.stages;
}

export async function listArchiveReasons(): Promise<ArchiveReason[]> {
  const body = await request<{ reasons: ArchiveReason[] }>('/api/employer/archive-reasons');
  return body.reasons;
}

export async function moveApplicant(
  applicationId: string,
  input: { stageId: string; note?: string },
): Promise<{ application: Applicant['application'] }> {
  return request(`${applicantPath(applicationId)}/move`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function archiveApplicant(
  applicationId: string,
  input: { reasonId: string; note?: string },
): Promise<{ application: Applicant['application'] }> {
  return request(`${applicantPath(applicationId)}/archive`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function unarchiveApplicant(
  applicationId: string,
): Promise<{ application: Applicant['application'] }> {
  return request(`${applicantPath(applicationId)}/unarchive`, { method: 'POST' });
}

/**
 * Bulk-archive many applications (PP1/PP3). Resolves with the per-item outcome body on
 * 200 (including partial success); throws EmployerApplicantsApiError with .code on a
 * whole-request failure (BULK_EMPTY / BULK_LIMIT_EXCEEDED / REASON_NOT_FOUND / 401 / 403).
 */
export async function bulkArchiveApplicants(
  input: { applicationIds: string[]; reasonId: string; note?: string },
): Promise<BulkArchiveResult> {
  return request<BulkArchiveResult>('/api/employer/applicants/bulk/archive', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
