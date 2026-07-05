// FILE: tests/hooks/seeker/useProfileMarketData.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const { fetchMatchCount, fetchSalaryBenchmark, SeekerApiError } = vi.hoisted(() => {
  class SeekerApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { fetchMatchCount: vi.fn(), fetchSalaryBenchmark: vi.fn(), SeekerApiError };
});
vi.mock('../../../src/api/seeker-api', () => ({ fetchMatchCount, fetchSalaryBenchmark, SeekerApiError }));

import { useProfileMarketData } from '../../../src/hooks/seeker/useProfileMarketData';

const MATCH = { count: 4, breakdown: { byLocation: [], byRoleCategory: [] }, asOf: '2026-01-01T00:00:00Z' };
const SALARY = { p25: 10, p50: 15, p75: 20, sampleSize: 12, currency: 'INR', unit: 'LPA', filters: {}, asOf: '2026-01-01T00:00:00Z' };

beforeEach(() => vi.clearAllMocks());

describe('useProfileMarketData', () => {
  it('both endpoints ok → loaded with both fields', async () => {
    fetchMatchCount.mockResolvedValue(MATCH);
    fetchSalaryBenchmark.mockResolvedValue(SALARY);
    const { result } = renderHook(() => useProfileMarketData());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.matchCount).toEqual(MATCH);
    expect(result.current.salaryBenchmark).toEqual(SALARY);
  });

  it('match ok + salary fails → loaded partial with salaryErrorCode', async () => {
    fetchMatchCount.mockResolvedValue(MATCH);
    fetchSalaryBenchmark.mockRejectedValue(new SeekerApiError(500, 'BENCH_FAIL', 'nope'));
    const { result } = renderHook(() => useProfileMarketData());
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.matchCount).toEqual(MATCH);
    expect(result.current.salaryBenchmark).toBeNull();
    expect(result.current.salaryErrorCode).toBe('BENCH_FAIL');
  });

  it('both fail → failed', async () => {
    fetchMatchCount.mockRejectedValue(new SeekerApiError(500, 'A', 'a'));
    fetchSalaryBenchmark.mockRejectedValue(new SeekerApiError(500, 'B', 'b'));
    const { result } = renderHook(() => useProfileMarketData());
    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.matchErrorCode).toBe('A');
    expect(result.current.salaryErrorCode).toBe('B');
  });

  it('unmount cancels (no late state update)', async () => {
    let resolve: (v: unknown) => void = () => {};
    fetchMatchCount.mockReturnValue(new Promise((r) => { resolve = r; }));
    fetchSalaryBenchmark.mockResolvedValue(SALARY);
    const { result, unmount } = renderHook(() => useProfileMarketData());
    unmount();
    await act(async () => { resolve(MATCH); await Promise.resolve(); });
    expect(result.current.matchCount).toBeNull();
  });
});
