// FILE: tests/api/public-api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchPublicCompany, fetchPublicJob, submitApplication, PublicApiError,
} from '../../src/api/public-api';

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('public-api', () => {
  it('fetchPublicCompany returns company + jobs', async () => {
    fetchMock.mockResolvedValue(response(200, { company: { name: 'Acme', slug: 'acme' }, jobs: [{ id: 'j1', slug: 'dev' }] }));
    const result = await fetchPublicCompany('acme');
    expect(result.company.name).toBe('Acme');
    expect(result.jobs).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/public/companies/acme');
  });

  it('fetchPublicJob returns company + job', async () => {
    fetchMock.mockResolvedValue(response(200, { company: { name: 'Acme' }, job: { id: 'j1', title: 'Dev' } }));
    const result = await fetchPublicJob('acme', 'dev');
    expect(result.job.title).toBe('Dev');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/public/jobs/acme/dev');
  });

  it('submitApplication POSTs FormData without credentials', async () => {
    fetchMock.mockResolvedValue(response(200, { applicationId: 'a1' }));
    const form = new FormData();
    form.append('firstName', 'Asha');
    const result = await submitApplication('acme', 'dev', form);
    expect(result.applicationId).toBe('a1');
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/public/jobs/acme/dev/apply');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.credentials).toBeUndefined();
  });

  it('non-2xx throws PublicApiError with status + code', async () => {
    fetchMock.mockResolvedValue(response(404, { error: 'nope', code: 'COMPANY_NOT_FOUND' }));
    await expect(fetchPublicCompany('nope')).rejects.toBeInstanceOf(PublicApiError);
    await expect(fetchPublicCompany('nope')).rejects.toMatchObject({ status: 404, code: 'COMPANY_NOT_FOUND' });
  });
});
