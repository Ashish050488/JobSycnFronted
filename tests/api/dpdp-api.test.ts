// FILE: tests/api/dpdp-api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchNoticeVersion, listConsents, grantConsent, withdrawConsent,
  submitRightsRequest, DpdpApiError,
} from '../../src/api/dpdp-api';

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('dpdp-api', () => {
  it('fetchNoticeVersion returns the typed shape', async () => {
    fetchMock.mockResolvedValue(response(200, { version: 'v1.0-2026-07', policyUrl: '/legal/privacy', grievanceEmail: 'privacy@jobmesh.in', crossBorderEnabled: true }));
    const info = await fetchNoticeVersion();
    expect(info.version).toBe('v1.0-2026-07');
    expect(info.grievanceEmail).toBe('privacy@jobmesh.in');
  });

  it('grantConsent POSTs the correct body', async () => {
    fetchMock.mockResolvedValue(response(201, { consent: { id: 'c1' } }));
    await grantConsent({ purpose: 'resume_parsing', dataItems: ['resume'], noticeVersion: 'v1.0-2026-07', method: 'checkbox', crossBorderTransfer: true });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/dpdp/consents');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({ purpose: 'resume_parsing', method: 'checkbox', crossBorderTransfer: true });
  });

  it('withdrawConsent calls POST /:id/withdraw', async () => {
    fetchMock.mockResolvedValue(response(200, { consent: { id: 'c1', withdrawnAt: 't' } }));
    await withdrawConsent('c1');
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/dpdp/consents/c1/withdraw');
    expect(init.method).toBe('POST');
  });

  it('listConsents sends ?includeWithdrawn when requested', async () => {
    fetchMock.mockResolvedValue(response(200, { consents: [] }));
    await listConsents({ includeWithdrawn: true });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/dpdp/consents?includeWithdrawn=true');
  });

  it('non-2xx throws DpdpApiError with status + code', async () => {
    fetchMock.mockResolvedValue(response(400, { error: 'bad', code: 'INVALID_CONSENT_PAYLOAD' }));
    await expect(submitRightsRequest({ requestType: 'access', description: '' }))
      .rejects.toBeInstanceOf(DpdpApiError);
    await expect(submitRightsRequest({ requestType: 'access', description: '' }))
      .rejects.toMatchObject({ status: 400, code: 'INVALID_CONSENT_PAYLOAD' });
  });
});
