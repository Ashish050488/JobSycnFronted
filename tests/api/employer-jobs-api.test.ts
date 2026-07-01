// FILE: tests/api/employer-jobs-api.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  listEmployerPostings, getEmployerPosting, createEmployerPosting, EmployerJobsApiError,
} from '../../src/api/employer-jobs-api';
import type { PostingCreateInput } from '../../src/types/employer-jobs';

const POSTING = {
  id: 'p1', slug: 'react-developer', title: 'React Developer', description: 'x', descriptionPlain: 'x',
  location: 'Bangalore', workplaceType: 'remote', employmentType: 'full-time',
  salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active',
  postedAt: 't', createdAt: 't', updatedAt: 't',
};

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => impl(String(url), init));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('employer-jobs-api', () => {
  it('listEmployerPostings without status omits the ?status param', async () => {
    const fetchMock = mockFetch(async () => response(200, { postings: [POSTING] }));
    const result = await listEmployerPostings();
    expect(result).toEqual([POSTING]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/employer/jobs');
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe('include');
  });

  it('listEmployerPostings with status sends ?status=active', async () => {
    const fetchMock = mockFetch(async () => response(200, { postings: [] }));
    await listEmployerPostings({ status: 'active' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/employer/jobs?status=active');
  });

  it('throws EmployerJobsApiError with status + code on non-2xx', async () => {
    mockFetch(async () => response(403, { error: 'No company', code: 'NO_COMPANY' }));
    await expect(listEmployerPostings()).rejects.toMatchObject({
      name: 'EmployerJobsApiError', status: 403, code: 'NO_COMPANY', message: 'No company',
    });
    expect((await listEmployerPostings().catch((error) => error)) instanceof EmployerJobsApiError).toBe(true);
  });

  it('createEmployerPosting POSTs the input body and returns the posting', async () => {
    const fetchMock = mockFetch(async () => response(201, { posting: POSTING }));
    const input: PostingCreateInput = {
      title: 'React Developer', description: 'x'.repeat(60), location: 'Bangalore',
      workplaceType: 'remote', employmentType: 'full-time',
    };
    const created = await createEmployerPosting(input);
    expect(created).toEqual(POSTING);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/employer/jobs');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual(input);
  });

  it('getEmployerPosting URL-encodes the posting id', async () => {
    const fetchMock = mockFetch(async () => response(200, { posting: POSTING }));
    await getEmployerPosting('a b/c');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/employer/jobs/a%20b%2Fc');
  });
});
