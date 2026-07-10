// FILE: tests/api/employer-applicants-api.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  listApplicantsForPosting, listStages, listArchiveReasons,
  moveApplicant, archiveApplicant, unarchiveApplicant, EmployerApplicantsApiError,
  fetchApplicantDetail, refreshResumeUrl, bulkArchiveApplicants, rescoreApplicant,
} from '../../src/api/employer-applicants-api';

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => impl(String(url), init));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('employer-applicants-api', () => {
  it('listApplicantsForPosting sends postingId + sort and returns applicants', async () => {
    const fetchMock = mockFetch(async () => response(200, { applicants: [] }));
    await listApplicantsForPosting('p1', { sort: 'score' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/employer/jobs/p1/applicants?sort=score');
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe('include');
  });

  it('listApplicantsForPosting omits sort when not given', async () => {
    const fetchMock = mockFetch(async () => response(200, { applicants: [] }));
    await listApplicantsForPosting('p1');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/employer/jobs/p1/applicants');
  });

  it('listStages and listArchiveReasons hit their endpoints', async () => {
    const stagesFetch = mockFetch(async () => response(200, { stages: [{ id: 's1' }] }));
    expect(await listStages()).toEqual([{ id: 's1' }]);
    expect(stagesFetch.mock.calls[0][0]).toBe('/api/employer/stages');
    const reasonsFetch = mockFetch(async () => response(200, { reasons: [{ id: 'r1' }] }));
    expect(await listArchiveReasons()).toEqual([{ id: 'r1' }]);
    expect(reasonsFetch.mock.calls[0][0]).toBe('/api/employer/archive-reasons');
  });

  it('moveApplicant POSTs { stageId } to the move endpoint', async () => {
    const fetchMock = mockFetch(async () => response(200, { application: { id: 'a1' } }));
    await moveApplicant('a1', { stageId: 's2', note: 'good' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/employer/applicants/a1/move');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ stageId: 's2', note: 'good' });
  });

  it('archiveApplicant POSTs { reasonId, note }; unarchive POSTs no body', async () => {
    const archiveFetch = mockFetch(async () => response(200, { application: { id: 'a1' } }));
    await archiveApplicant('a1', { reasonId: 'r1', note: 'too junior' });
    expect(JSON.parse(archiveFetch.mock.calls[0][1]?.body as string)).toEqual({ reasonId: 'r1', note: 'too junior' });
    const unarchiveFetch = mockFetch(async () => response(200, { application: { id: 'a1' } }));
    await unarchiveApplicant('a1');
    expect(unarchiveFetch.mock.calls[0][0]).toBe('/api/employer/applicants/a1/unarchive');
    expect(unarchiveFetch.mock.calls[0][1]?.method).toBe('POST');
  });

  it('fetchApplicantDetail GETs the applicant endpoint and unwraps { applicant }', async () => {
    const fetchMock = mockFetch(async () => response(200, { applicant: { application: { id: 'a1' } } }));
    const detail = await fetchApplicantDetail('a1');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/employer/applicants/a1');
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe('include');
    expect(detail).toEqual({ application: { id: 'a1' } });
  });

  it('refreshResumeUrl GETs the resume-url endpoint and returns { url, expiresAt }', async () => {
    const fetchMock = mockFetch(async () => response(200, { url: '/api/public/resume-download?token=t', expiresAt: '2026-07-03T00:15:00Z' }));
    const result = await refreshResumeUrl('a1');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/employer/applicants/a1/resume-url');
    expect(result.url).toBe('/api/public/resume-download?token=t');
    expect(result.expiresAt).toBe('2026-07-03T00:15:00Z');
  });

  it('throws EmployerApplicantsApiError with status + code on non-2xx', async () => {
    mockFetch(async () => response(409, { error: 'Cannot move', code: 'CANNOT_MOVE_ARCHIVED' }));
    const error = await moveApplicant('a1', { stageId: 's2' }).catch((caught) => caught);
    expect(error).toBeInstanceOf(EmployerApplicantsApiError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('CANNOT_MOVE_ARCHIVED');
  });

  it('bulkArchiveApplicants POSTs the body and resolves to the outcome shape', async () => {
    const outcome = { succeeded: [{ id: 'a1' }], failed: [], total: 1, successCount: 1, failureCount: 0 };
    const fetchMock = mockFetch(async () => response(200, outcome));
    const result = await bulkArchiveApplicants({ applicationIds: ['a1'], reasonId: 'r1', note: 'n' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/employer/applicants/bulk/archive');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ applicationIds: ['a1'], reasonId: 'r1', note: 'n' });
    expect(result).toEqual(outcome);
  });

  it('bulkArchiveApplicants throws EmployerApplicantsApiError with .code on a whole-request failure', async () => {
    mockFetch(async () => response(400, { error: 'Too many', code: 'BULK_LIMIT_EXCEEDED' }));
    const error = await bulkArchiveApplicants({ applicationIds: [], reasonId: 'r1' }).catch((caught) => caught);
    expect(error).toBeInstanceOf(EmployerApplicantsApiError);
    expect(error.code).toBe('BULK_LIMIT_EXCEEDED');
  });

  // D15(o)
  it('rescoreApplicant POSTs to the rescore endpoint with credentials and no body', async () => {
    const fetchMock = mockFetch(async () => response(202, { rescored: true, jobStatus: 'queued', jobId: 'j1', attemptCount: 0 }));
    const result = await rescoreApplicant('a1');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/employer/applicants/a1/rescore');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe('include');
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
    expect(result).toEqual({ rescored: true, jobStatus: 'queued', jobId: 'j1', attemptCount: 0 });
  });

  it('rescoreApplicant resolves on a 200 no-op (already in flight)', async () => {
    mockFetch(async () => response(200, { rescored: false, jobStatus: 'processing', jobId: 'j1', attemptCount: 1 }));
    const result = await rescoreApplicant('a1');
    expect(result.rescored).toBe(false);
    expect(result.jobStatus).toBe('processing');
  });

  // D15(p)
  it('rescoreApplicant throws EmployerApplicantsApiError on 500', async () => {
    mockFetch(async () => response(500, { error: 'Could not queue a rescore.', code: 'RESCORE_ENQUEUE_FAILED' }));
    const error = await rescoreApplicant('a1').catch((caught) => caught);
    expect(error).toBeInstanceOf(EmployerApplicantsApiError);
    expect(error.status).toBe(500);
    expect(error.code).toBe('RESCORE_ENQUEUE_FAILED');
  });

  it('rescoreApplicant encodes the applicationId', async () => {
    const fetchMock = mockFetch(async () => response(202, {}));
    await rescoreApplicant('a/1');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/employer/applicants/a%2F1/rescore');
  });
});
