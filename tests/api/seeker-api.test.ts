// FILE: tests/api/seeker-api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  uploadResume, uploadResumeText, fetchProfile, patchProfile, fetchResumeJob, SeekerApiError,
} from '../../src/api/seeker-api';

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => { fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('seeker-api', () => {
  it('uploadResume sends FormData with a "resume" field and normalizes the queued branch', async () => {
    fetchMock.mockResolvedValue(response(200, { jobId: 'job-1', status: 'queued' }));
    const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
    const result = await uploadResume(file);
    expect(result).toEqual({ kind: 'queued', jobId: 'job-1' });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/seeker/resume/upload');
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('resume')).toBeInstanceOf(File);
  });

  it('uploadResume normalizes the dedup fast-path into the unchanged branch', async () => {
    const profile = { fullName: 'A' };
    fetchMock.mockResolvedValue(response(200, { profile, isUnchanged: true, jobId: null }));
    const result = await uploadResume(new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' }));
    expect(result).toEqual({ kind: 'unchanged', profile });
  });

  it('uploadResumeText sends { text } as JSON and mirrors both branches', async () => {
    fetchMock.mockResolvedValue(response(200, { jobId: 'job-2', status: 'queued' }));
    const queued = await uploadResumeText('some long resume text');
    expect(queued).toEqual({ kind: 'queued', jobId: 'job-2' });
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/seeker/resume/text');
    expect(JSON.parse(init.body)).toEqual({ text: 'some long resume text' });

    const profile = { fullName: 'B' };
    fetchMock.mockResolvedValue(response(200, { profile, isUnchanged: true, jobId: null }));
    expect(await uploadResumeText('some long resume text')).toEqual({ kind: 'unchanged', profile });
  });

  it('fetchResumeJob unwraps { job } and returns the inner shape', async () => {
    const job = { id: 'job-1', status: 'done', result: { profile: { fullName: 'A' }, isUnchanged: false }, errorCode: null, errorMessage: null };
    fetchMock.mockResolvedValue(response(200, { job }));
    expect(await fetchResumeJob('job-1')).toEqual(job);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/seeker/resume/jobs/job-1');
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
