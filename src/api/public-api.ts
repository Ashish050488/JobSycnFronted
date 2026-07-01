// FILE: src/api/public-api.ts
// Typed client for the public apply endpoints (/api/public). These are
// unauthenticated — no credentials are sent. Throws PublicApiError (status +
// code) on non-2xx. Apply pages call only this module — never fetch() directly.

import type { PublicCompany, PublicJob, PublicJobSummary } from '../types/public-apply';

export class PublicApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'PublicApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PublicApiError(response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`);
  }
  return body as T;
}

export async function fetchPublicCompany(
  companySlug: string,
): Promise<{ company: PublicCompany; jobs: PublicJobSummary[] }> {
  return request(`/api/public/companies/${encodeURIComponent(companySlug)}`);
}

export async function fetchPublicJob(
  companySlug: string, jobSlug: string,
): Promise<{ company: PublicCompany; job: PublicJob }> {
  return request(`/api/public/jobs/${encodeURIComponent(companySlug)}/${encodeURIComponent(jobSlug)}`);
}

export async function submitApplication(
  companySlug: string, jobSlug: string, formData: FormData,
): Promise<{ applicationId: string }> {
  // multipart/form-data — the browser sets the boundary; no credentials (public).
  return request(
    `/api/public/jobs/${encodeURIComponent(companySlug)}/${encodeURIComponent(jobSlug)}/apply`,
    { method: 'POST', body: formData },
  );
}
