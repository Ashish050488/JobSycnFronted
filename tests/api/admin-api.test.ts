// FILE: tests/api/admin-api.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchEmployerAccess, setEmployerSignupOpen, addWhitelistEntry, removeWhitelistEntry,
  AdminApiError,
} from '../../src/api/admin-api';

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => impl(String(url), init));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('admin-api', () => {
  it('fetchEmployerAccess unwraps the { data } envelope', async () => {
    mockFetch(async () => response(200, { data: { isEmployerSignupOpen: true, whitelist: [] } }));
    const state = await fetchEmployerAccess();
    expect(state).toEqual({ isEmployerSignupOpen: true, whitelist: [] });
  });

  it('throws AdminApiError with status, code and message on non-2xx', async () => {
    mockFetch(async () => response(403, { error: 'Forbidden', code: 'NOPE' }));
    await expect(fetchEmployerAccess()).rejects.toMatchObject({
      name: 'AdminApiError', status: 403, code: 'NOPE', message: 'Forbidden',
    });
    expect((await fetchEmployerAccess().catch((error) => error)) instanceof AdminApiError).toBe(true);
  });

  it('addWhitelistEntry posts { email, note } with credentials included', async () => {
    const fetchMock = mockFetch(async () => response(200, { data: { email: 'a@b.com', note: 'hi', addedAt: 't' } }));
    await addWhitelistEntry('a@b.com', 'hi');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/employer-access/whitelist');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('include');
    expect(JSON.parse(init?.body as string)).toEqual({ email: 'a@b.com', note: 'hi' });
  });

  it('removeWhitelistEntry URL-encodes the email path param', async () => {
    const fetchMock = mockFetch(async () => response(200, { data: { deleted: true } }));
    await removeWhitelistEntry('FOO@bar.com');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/employer-access/whitelist/FOO%40bar.com');
    expect(init?.method).toBe('DELETE');
  });

  it('setEmployerSignupOpen posts { isEmployerSignupOpen: boolean }', async () => {
    const fetchMock = mockFetch(async () => response(200, { data: { isEmployerSignupOpen: false, updatedAt: 't' } }));
    await setEmployerSignupOpen(false);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/employer-access/toggle');
    expect(JSON.parse(init?.body as string)).toEqual({ isEmployerSignupOpen: false });
  });
});
