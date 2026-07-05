// FILE: tests/hooks/seeker/useResumeParseJob.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { fetchResumeJob } = vi.hoisted(() => ({ fetchResumeJob: vi.fn() }));
vi.mock('../../../src/api/seeker-api', () => ({ fetchResumeJob }));

import { useResumeParseJob } from '../../../src/hooks/seeker/useResumeParseJob';

const PROFILE = { fullName: 'Asha' };
const job = (over: Record<string, unknown>) => ({
  id: 'job-1', status: 'processing', result: null, errorCode: null, errorMessage: null, ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

async function flush(ms = 0) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

describe('useResumeParseJob', () => {
  it('jobId null → inert (no fetch, status idle)', async () => {
    const { result } = renderHook(() => useResumeParseJob(null));
    await flush();
    expect(result.current.status).toBe('idle');
    expect(fetchResumeJob).not.toHaveBeenCalled();
  });

  it('polls until done → status done + profile', async () => {
    fetchResumeJob
      .mockResolvedValueOnce(job({ status: 'processing' }))
      .mockResolvedValueOnce(job({ status: 'done', result: { profile: PROFILE, isUnchanged: false } }));
    const { result } = renderHook(() => useResumeParseJob('job-1'));
    await flush();
    expect(result.current.status).toBe('polling');
    await flush(2000);
    expect(result.current.status).toBe('done');
    expect(result.current.profile).toEqual(PROFILE);
  });

  it('polls until failed → status failed + errorCode', async () => {
    fetchResumeJob.mockResolvedValueOnce(job({ status: 'failed', errorCode: 'RESUME_PARSE_FAILED', errorMessage: 'nope' }));
    const { result } = renderHook(() => useResumeParseJob('job-1'));
    await flush();
    expect(result.current.status).toBe('failed');
    expect(result.current.errorCode).toBe('RESUME_PARSE_FAILED');
    expect(result.current.errorMessage).toBe('nope');
  });

  it('network error backs the next poll off, then resets on success', async () => {
    fetchResumeJob
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(job({ status: 'processing' }))
      .mockResolvedValueOnce(job({ status: 'done', result: { profile: PROFILE, isUnchanged: false } }));
    const { result } = renderHook(() => useResumeParseJob('job-1'));
    await flush();
    expect(fetchResumeJob).toHaveBeenCalledTimes(1);
    await flush(2000); // still backing off (next poll at 4000ms) — no new call
    expect(fetchResumeJob).toHaveBeenCalledTimes(1);
    await flush(2000); // reaches 4000ms → second poll (processing) resets delay to 2000
    expect(fetchResumeJob).toHaveBeenCalledTimes(2);
    await flush(2000); // reset interval → third poll → done
    expect(fetchResumeJob).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe('done');
  });

  it('overall timeout elapses → status timeout + POLL_TIMEOUT', async () => {
    fetchResumeJob.mockResolvedValue(job({ status: 'processing' }));
    const { result } = renderHook(() => useResumeParseJob('job-1'));
    await flush();
    await flush(180_000);
    expect(result.current.status).toBe('timeout');
    expect(result.current.errorCode).toBe('POLL_TIMEOUT');
  });

  it('unmount aborts the in-flight fetch and clears timers (no later state updates)', async () => {
    fetchResumeJob.mockResolvedValue(job({ status: 'processing' }));
    const { result, unmount } = renderHook(() => useResumeParseJob('job-1'));
    await flush();
    const callsAtUnmount = fetchResumeJob.mock.calls.length;
    const statusAtUnmount = result.current.status;
    unmount();
    await flush(10_000);
    expect(fetchResumeJob).toHaveBeenCalledTimes(callsAtUnmount);
    expect(result.current.status).toBe(statusAtUnmount);
  });
});
