// FILE: src/api/employer-api.ts
// Thin client for the employer company endpoints (/api/employer/company).
// Every call sends the employer auth cookie, reads the { company } body, and
// throws EmployerApiError (carrying status + code) on any non-2xx response.
// Employer pages call only this module — never fetch() directly.

import type { EmployerCompany } from '../context/employer/employer-context-types';

export class EmployerApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerApiError';
    this.status = status;
    this.code = code;
  }
}

export interface CreateEmployerCompanyInput {
  name: string;
  website?: string;
  retentionDays?: number;
}

export interface UpdateEmployerCompanyPatch {
  name?: string;
  website?: string | null;
  retentionDays?: number;
  privacyPolicyUrl?: string | null;
  dpoEmail?: string | null;
}

interface CompanyEnvelope {
  company: EmployerCompany;
}

async function request(path: string, init?: RequestInit): Promise<CompanyEnvelope> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as CompanyEnvelope;
}

export async function createEmployerCompany(
  input: CreateEmployerCompanyInput,
): Promise<EmployerCompany> {
  const body = await request('/api/employer/company', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.company;
}

export async function updateEmployerCompany(
  patch: UpdateEmployerCompanyPatch,
): Promise<EmployerCompany> {
  const body = await request('/api/employer/company', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return body.company;
}

export async function fetchEmployerCompany(): Promise<EmployerCompany> {
  const body = await request('/api/employer/company');
  return body.company;
}
