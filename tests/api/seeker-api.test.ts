// FILE: tests/api/seeker-api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  uploadResume, uploadResumeText, fetchProfile, patchProfile, SeekerApiError,
} from '../../src/api/seeker-api';

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('seeker-api', () => {
  it('uploadResume sends FormData with a "resume" field', async () => {
    fetchMock.mockResolvedValue(response(200, { profile: { fullName: 'A' }, isUnchanged: false }));
    const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
    const result = await uploadResume(file);
    expect(result.profile.fullName).toBe('A');
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/seeker/resume/upload');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('resume')).toBeInstanceOf(File);
  });

  it('uploadResumeText sends { text } as JSON', async () => {
    fetchMock.mockResolvedValue(response(200, { profile: {}, isUnchanged: false }));
    await uploadResumeText('some long resume text');
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/seeker/resume/text');
    expect(JSON.parse(init.body)).toEqual({ text: 'some long resume text' });
  });

  it('fetchProfile returns null when the profile is null', async () => {
    fetchMock.mockResolvedValue(response(200, { profile: null }));
    expect(await fetchProfile()).toBeNull();
  });

  it('patchProfile sends a PATCH with the body', async () => {
    fetchMock.mockResolvedValue(response(200, { profile: { fullName: 'B' } }));
    const updated = await patchProfile({ fullName: 'B' });
    expect(updated.fullName).toBe('B');
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/seeker/profile');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ fullName: 'B' });
  });

  it('non-2xx throws SeekerApiError with status + code', async () => {
    fetchMock.mockResolvedValue(response(400, { error: 'bad', code: 'INVALID_RESUME_TEXT' }));
    await expect(uploadResumeText('x')).rejects.toBeInstanceOf(SeekerApiError);
    await expect(uploadResumeText('x')).rejects.toMatchObject({ status: 400, code: 'INVALID_RESUME_TEXT' });
  });
});
