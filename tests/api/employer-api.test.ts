// FILE: tests/api/employer-api.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createEmployerCompany, updateEmployerCompany, fetchEmployerCompany, EmployerApiError,
} from '../../src/api/employer-api';

const COMPANY = {
  id: 'c1', slug: 'acme', name: 'Acme', website: null, logoUrl: null,
  plan: 'free', retentionDays: 365, privacyPolicyUrl: null, dpoEmail: null, createdAt: 't',
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

describe('employer-api', () => {
  it('createEmployerCompany posts the body with credentials and returns company', async () => {
    const fetchMock = mockFetch(async () => response(200, { company: COMPANY }));
    const result = await createEmployerCompany({ name: 'Acme', website: 'https://acme.in', retentionDays: 365 });
    expect(result).toEqual(COMPANY);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/employer/company');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('include');
    expect(JSON.parse(init?.body as string)).toEqual({
      name: 'Acme', website: 'https://acme.in', retentionDays: 365,
    });
  });

  it('createEmployerCompany throws EmployerApiError on 409 ALREADY_ONBOARDED', async () => {
    mockFetch(async () => response(409, { error: 'Already onboarded', code: 'ALREADY_ONBOARDED' }));
    await expect(createEmployerCompany({ name: 'Acme' })).rejects.toMatchObject({
      name: 'EmployerApiError', status: 409, code: 'ALREADY_ONBOARDED', message: 'Already onboarded',
    });
    expect((await createEmployerCompany({ name: 'Acme' }).catch((error) => error)) instanceof EmployerApiError).toBe(true);
  });

  it('fetchEmployerCompany surfaces a 404 NO_COMPANY as EmployerApiError', async () => {
    mockFetch(async () => response(404, { error: 'No company', code: 'NO_COMPANY' }));
    await expect(fetchEmployerCompany()).rejects.toMatchObject({ status: 404, code: 'NO_COMPANY' });
  });

  it('updateEmployerCompany sends a PATCH with the patch body', async () => {
    const fetchMock = mockFetch(async () => response(200, { company: COMPANY }));
    await updateEmployerCompany({ retentionDays: 180 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/employer/company');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(init?.body as string)).toEqual({ retentionDays: 180 });
  });
});
