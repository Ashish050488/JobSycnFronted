// FILE: tests/components/seeker/ProfileMarketCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UseProfileMarketDataResult } from '../../../src/hooks/seeker/useProfileMarketData';

const hookState: { current: UseProfileMarketDataResult } = { current: null as never };
vi.mock('../../../src/hooks/seeker/useProfileMarketData', () => ({
  useProfileMarketData: () => hookState.current,
}));

import ProfileMarketCard from '../../../src/components/seeker/ProfileMarketCard';

const MATCH = {
  count: 12,
  breakdown: { byLocation: [{ key: 'Bangalore', count: 8 }], byRoleCategory: [{ key: 'Engineering', count: 10 }] },
  asOf: '2026-01-01T00:00:00Z',
};
const SALARY_OK = { p25: 12, p50: 15.5, p75: 20, sampleSize: 14, currency: 'INR', unit: 'LPA', filters: {}, asOf: '2026-01-01T00:00:00Z' };
const SALARY_LOW = { p25: null, p50: null, p75: null, sampleSize: 3, currency: 'INR', unit: 'LPA', filters: {}, asOf: '2026-01-01T00:00:00Z' };

function mockHook(over: Partial<UseProfileMarketDataResult>) {
  hookState.current = {
    matchCount: null, salaryBenchmark: null, matchErrorCode: null, salaryErrorCode: null, status: 'loaded',
    ...over,
  } as UseProfileMarketDataResult;
}

beforeEach(() => vi.clearAllMocks());

describe('ProfileMarketCard', () => {
  it('sampleSize < 10 → "Not enough…" salary message', () => {
    mockHook({ matchCount: MATCH, salaryBenchmark: SALARY_LOW });
    render(<ProfileMarketCard />);
    expect(screen.getByText(/Not enough matching postings yet to benchmark salary/i)).toBeInTheDocument();
  });

  it('sampleSize >= 10 → formatted band with median', () => {
    mockHook({ matchCount: MATCH, salaryBenchmark: SALARY_OK });
    render(<ProfileMarketCard />);
    expect(screen.getByText('₹12L – ₹20L (median ₹15.5L)')).toBeInTheDocument();
    expect(screen.getByText(/Based on 14 matching postings/)).toBeInTheDocument();
  });

  it('count 0 → "No matching postings yet." message', () => {
    mockHook({ matchCount: { ...MATCH, count: 0 }, salaryBenchmark: SALARY_LOW });
    render(<ProfileMarketCard />);
    expect(screen.getByText(/No matching postings yet/)).toBeInTheDocument();
  });

  it('match ok + salary failed → count shown, inline salary error', () => {
    mockHook({ matchCount: MATCH, salaryBenchmark: null, salaryErrorCode: 'BENCH_FAIL' });
    render(<ProfileMarketCard />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/Couldn't load the salary benchmark/i)).toBeInTheDocument();
  });
});
