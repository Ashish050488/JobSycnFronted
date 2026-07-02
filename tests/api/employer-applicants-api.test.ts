// FILE: tests/api/employer-applicants-api.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  listApplicantsForPosting, listStages, listArchiveReasons,
  moveApplicant, archiveApplicant, unarchiveApplicant, EmployerApplicantsApiError,
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

  it('throws EmployerApplicantsApiError with status + code on non-2xx', async () => {
    mockFetch(async () => response(409, { error: 'Cannot move', code: 'CANNOT_MOVE_ARCHIVED' }));
    const error = await moveApplicant('a1', { stageId: 's2' }).catch((caught) => caught);
    expect(error).toBeInstanceOf(EmployerApplicantsApiError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('CANNOT_MOVE_ARCHIVED');
  });
});
