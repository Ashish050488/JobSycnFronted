// FILE: tests/hooks/seeker/useResumeReview.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { fetchResumeReview, runResumeReview, SeekerApiError } = vi.hoisted(() => {
  class SeekerApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { fetchResumeReview: vi.fn(), runResumeReview: vi.fn(), SeekerApiError };
});
vi.mock('../../../src/api/seeker-api', () => ({ fetchResumeReview, runResumeReview, SeekerApiError }));

import { useResumeReview } from '../../../src/hooks/seeker/useResumeReview';

const REVIEW = { scores: { overall: 80, parseability: 70, contentStrength: 80, indiaMarketFit: 60, skillsDepth: 90 },
  strengths: [], findings: [], topImprovements: [], reviewedAt: '2026-01-01T00:00:00Z', modelVersion: 'g' };

beforeEach(() => vi.clearAllMocks());

describe('useResumeReview', () => {
  it('initial GET null → loaded with review null', async () => {
    fetchResumeReview.mockResolvedValue(null);
    const { result } = renderHook(() => useResumeReview());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.review).toBeNull();
  });

  it('initial GET review → loaded with review populated', async () => {
    fetchResumeReview.mockResolvedValue(REVIEW);
    const { result } = renderHook(() => useResumeReview());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.review).toEqual(REVIEW);
  });

  it('run() success → loaded with the new review', async () => {
    fetchResumeReview.mockResolvedValue(null);
    runResumeReview.mockResolvedValue(REVIEW);
    const { result } = renderHook(() => useResumeReview());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    await act(async () => { await result.current.run(); });
    expect(result.current.status).toBe('loaded');
    expect(result.current.review).toEqual(REVIEW);
  });

  it('run() failure with a mapped code → failed + errorCode', async () => {
    fetchResumeReview.mockResolvedValue(null);
    runResumeReview.mockRejectedValue(new SeekerApiError(400, 'NO_PROFILE', 'no profile'));
    const { result } = renderHook(() => useResumeReview());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    await act(async () => { await result.current.run(); });
    expect(result.current.status).toBe('failed');
    expect(result.current.errorCode).toBe('NO_PROFILE');
  });

  it('run() failure with a non-api error → failed with message fallback, code null', async () => {
    fetchResumeReview.mockResolvedValue(null);
    runResumeReview.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useResumeReview());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    await act(async () => { await result.current.run(); });
    expect(result.current.status).toBe('failed');
    expect(result.current.errorCode).toBeNull();
    expect(result.current.errorMessage).toBe('boom');
  });

  it('unmount aborts the in-flight GET (no state update after)', async () => {
    let resolve: (v: unknown) => void = () => {};
    fetchResumeReview.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result, unmount } = renderHook(() => useResumeReview());
    const statusAtUnmount = result.current.status;
    unmount();
    await act(async () => { resolve(REVIEW); await Promise.resolve(); });
    expect(result.current.status).toBe(statusAtUnmount);
    expect(result.current.review).toBeNull();
  });
});
