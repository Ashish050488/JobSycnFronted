// FILE: src/api/seeker-api.ts
// Typed client for the seeker resume + profile endpoints (/api/seeker/resume,
// /api/seeker/profile). Sends the seeker auth cookie, reads the typed envelope,
// throws SeekerApiError (status + code) on non-2xx. Resume/profile UI calls only
// this module — never fetch() directly.

import type { ParsedProfile, ResumeUploadResult } from '../types/seeker-profile';

export class SeekerApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'SeekerApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'include', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new SeekerApiError(response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`);
  }
  return body as T;
}

/** Upload a resume PDF as multipart/form-data (field name 'resume', R2). */
export async function uploadResume(file: File): Promise<ResumeUploadResult> {
  const form = new FormData();
  form.append('resume', file);
  // No Content-Type header — the browser sets the multipart boundary.
  return request<ResumeUploadResult>('/api/seeker/resume/upload', { method: 'POST', body: form });
}

/** Parse a pasted resume-text fallback. */
export async function uploadResumeText(text: string): Promise<ResumeUploadResult> {
  return request<ResumeUploadResult>('/api/seeker/resume/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

/** The caller's parsed profile, or null when not parsed yet. */
export async function fetchProfile(): Promise<ParsedProfile | null> {
  const body = await request<{ profile: ParsedProfile | null }>('/api/seeker/profile');
  return body.profile ?? null;
}

/** Patch whitelisted profile fields; returns the updated profile. */
export async function patchProfile(patch: Partial<ParsedProfile>): Promise<ParsedProfile> {
  const body = await request<{ profile: ParsedProfile }>('/api/seeker/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return body.profile;
}
