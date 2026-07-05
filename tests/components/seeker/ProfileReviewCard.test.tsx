// FILE: tests/components/seeker/ProfileReviewCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { UseResumeReviewResult } from '../../../src/hooks/seeker/useResumeReview';

const hookState: { current: UseResumeReviewResult } = { current: null as never };
vi.mock('../../../src/hooks/seeker/useResumeReview', () => ({
  useResumeReview: () => hookState.current,
}));

import ProfileReviewCard from '../../../src/components/seeker/ProfileReviewCard';

const REVIEW = {
  scores: { overall: 74, parseability: 85, contentStrength: 70, indiaMarketFit: 55, skillsDepth: 90 },
  strengths: ['Strong Node.js'], findings: [],
  topImprovements: [{ title: 'Quantify impact', why: 'why', observedBullet: 'did things', question: 'how much?' }],
  reviewedAt: '2026-01-01T00:00:00Z', modelVersion: 'g',
};

function mockHook(over: Partial<UseResumeReviewResult>): ReturnType<typeof vi.fn> {
  const run = vi.fn();
  hookState.current = {
    review: null, status: 'loaded', errorCode: null, errorMessage: null, run,
    computeStale: (p) => (over.review ? new Date(over.review.reviewedAt) < new Date(p ?? '') : false),
    ...over,
  } as UseResumeReviewResult;
  return run;
}

beforeEach(() => vi.clearAllMocks());

describe('ProfileReviewCard', () => {
  it('empty state → Run review button, click fires run()', () => {
    const run = mockHook({ review: null, status: 'loaded' });
    render(<ProfileReviewCard profileUpdatedAt={null} />);
    const button = screen.getByRole('button', { name: 'Run review' });
    fireEvent.click(button);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('running → button flips to "Reviewing…", disabled, and carries NO aria-busy (R2/V8)', () => {
    mockHook({ review: null, status: 'running' });
    render(<ProfileReviewCard profileUpdatedAt={null} />);
    const button = screen.getByRole('button', { name: /Reviewing/ });
    expect(button).toBeDisabled();
    expect(button.getAttribute('aria-busy')).toBeNull();
  });

  it('loaded → shows stale badge when profileUpdatedAt is after reviewedAt', () => {
    mockHook({ review: REVIEW, status: 'loaded' });
    render(<ProfileReviewCard profileUpdatedAt="2026-06-01T00:00:00Z" />);
    expect(screen.getByText('Profile changed after this review')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh review' })).toBeInTheDocument();
  });

  it('loaded → no stale badge when review is newer than the profile', () => {
    mockHook({ review: REVIEW, status: 'loaded' });
    render(<ProfileReviewCard profileUpdatedAt="2025-01-01T00:00:00Z" />);
    expect(screen.queryByText('Profile changed after this review')).toBeNull();
  });

  it('failed with NO_PROFILE → mapped copy + Try again fires run()', () => {
    const run = mockHook({ status: 'failed', errorCode: 'NO_PROFILE', errorMessage: 'raw' });
    render(<ProfileReviewCard profileUpdatedAt={null} />);
    expect(screen.getByText('Upload your resume first to run a review.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('failed with an unknown code → server message fallback + single console.warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockHook({ status: 'failed', errorCode: 'SOMETHING_NEW', errorMessage: 'A brand new message.' });
    render(<ProfileReviewCard profileUpdatedAt={null} />);
    expect(screen.getByText('A brand new message.')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('SOMETHING_NEW'));
    warn.mockRestore();
  });
});
