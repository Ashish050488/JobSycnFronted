// FILE: tests/hooks/employer/useEmployerAuth.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const googleLogout = vi.fn();
vi.mock('@react-oauth/google', () => ({ googleLogout: () => googleLogout() }));

import { useEmployerAuth } from '../../../src/hooks/employer/useEmployerAuth';

const EMPLOYER = { id: 'e1', email: 'owner@acme.com', name: 'Owner', picture: null, companyId: null };

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

/** Route fetch calls by URL substring → queued Response (or thrown error). */
function routeFetch(routes: Record<string, () => Promise<Response>>) {
  const fetchMock = vi.fn(async (url: string) => {
    const key = Object.keys(routes).find((part) => url.includes(part));
    if (!key) throw new Error(`unexpected fetch: ${url}`);
    return routes[key]();
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  googleLogout.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useEmployerAuth', () => {
  it('initial /me 401 → employerUser stays null, isLoading false', async () => {
    routeFetch({ '/me': async () => response(401, { error: 'Unauthorized' }) });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.employerUser).toBeNull();
  });

  it('initial /me 200 → employerUser populated', async () => {
    routeFetch({ '/me': async () => response(200, { employerUser: EMPLOYER }) });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.employerUser).toEqual(EMPLOYER);
  });

  it('login success → employerUser populated, no loginError', async () => {
    // After /google sets the cookie, login refreshes via /me (3B) — so /me now
    // answers 200 with the session rather than the pre-login 401.
    routeFetch({
      '/me': async () => response(200, { employerUser: EMPLOYER }),
      '/google': async () => response(200, { employerUser: EMPLOYER }),
    });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.login('cred'); });
    expect(result.current.employerUser).toEqual(EMPLOYER);
    expect(result.current.loginError).toBeNull();
  });

  it('login 403 EMPLOYER_SIGNUP_GATED → loginError.kind gated', async () => {
    routeFetch({
      '/me': async () => response(401, {}),
      '/google': async () => response(403, { error: 'gated msg', code: 'EMPLOYER_SIGNUP_GATED' }),
    });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.login('cred'); });
    expect(result.current.loginError).toEqual({ kind: 'gated', message: 'gated msg' });
  });

  it('login 401 INVALID_GOOGLE_TOKEN → loginError.kind invalid', async () => {
    routeFetch({
      '/me': async () => response(401, {}),
      '/google': async () => response(401, { error: 'bad token', code: 'INVALID_GOOGLE_TOKEN' }),
    });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.login('cred'); });
    expect(result.current.loginError?.kind).toBe('invalid');
  });

  it('login fetch throws → loginError.kind network', async () => {
    routeFetch({
      '/me': async () => response(401, {}),
      '/google': async () => { throw new TypeError('network down'); },
    });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.login('cred'); });
    expect(result.current.loginError?.kind).toBe('network');
  });

  it('logout clears employerUser and calls googleLogout', async () => {
    routeFetch({
      '/me': async () => response(200, { employerUser: EMPLOYER }),
      '/logout': async () => response(200, { success: true }),
    });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.employerUser).toEqual(EMPLOYER));
    await act(async () => { await result.current.logout(); });
    expect(result.current.employerUser).toBeNull();
    expect(googleLogout).toHaveBeenCalledTimes(1);
  });
});
