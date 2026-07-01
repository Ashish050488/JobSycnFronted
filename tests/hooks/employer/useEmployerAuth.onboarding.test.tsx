// FILE: tests/hooks/employer/useEmployerAuth.onboarding.test.tsx
// 3B additions: the hook now carries `company` from /me and exposes
// refreshEmployerSession. Kept separate from useEmployerAuth.test.tsx so each
// file stays well under the 200-line cap.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const googleLogout = vi.fn();
vi.mock('@react-oauth/google', () => ({ googleLogout: () => googleLogout() }));

import { useEmployerAuth } from '../../../src/hooks/employer/useEmployerAuth';

const EMPLOYER = { id: 'e1', email: 'owner@acme.com', name: 'Owner', picture: null, companyId: 'c1' };
const COMPANY = {
  id: 'c1', slug: 'acme', name: 'Acme', website: null, logoUrl: null,
  plan: 'free', retentionDays: 365, privacyPolicyUrl: null, dpoEmail: null, createdAt: 't',
};

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function routeFetch(routes: Record<string, () => Promise<Response>>) {
  const fetchMock = vi.fn(async (url: string) => {
    const key = Object.keys(routes).find((part) => url.includes(part));
    if (!key) throw new Error(`unexpected fetch: ${url}`);
    return routes[key]();
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => googleLogout.mockClear());
afterEach(() => vi.unstubAllGlobals());

describe('useEmployerAuth — company state (3B)', () => {
  it('initial /me with company:null → employerUser set, company null', async () => {
    routeFetch({ '/me': async () => response(200, { employerUser: EMPLOYER, company: null }) });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.employerUser).toEqual(EMPLOYER);
    expect(result.current.company).toBeNull();
  });

  it('initial /me with a company → both populated', async () => {
    routeFetch({ '/me': async () => response(200, { employerUser: EMPLOYER, company: COMPANY }) });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.employerUser).toEqual(EMPLOYER);
    expect(result.current.company).toEqual(COMPANY);
  });

  it('refreshEmployerSession re-fetches /me and updates company', async () => {
    let currentCompany: unknown = null;
    routeFetch({ '/me': async () => response(200, { employerUser: EMPLOYER, company: currentCompany }) });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.company).toBeNull();

    currentCompany = COMPANY;
    await act(async () => { await result.current.refreshEmployerSession(); });
    expect(result.current.company).toEqual(COMPANY);
  });

  it('logout clears both employerUser and company', async () => {
    routeFetch({
      '/me': async () => response(200, { employerUser: EMPLOYER, company: COMPANY }),
      '/logout': async () => response(200, { success: true }),
    });
    const { result } = renderHook(() => useEmployerAuth());
    await waitFor(() => expect(result.current.company).toEqual(COMPANY));
    await act(async () => { await result.current.logout(); });
    expect(result.current.employerUser).toBeNull();
    expect(result.current.company).toBeNull();
  });
});
