// FILE: tests/pages/employer/ApplicantScoreCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ApplicantScoreCard from '../../../src/pages/employer/Jobs/ApplicantScoreCard';
import type { ApplicantScore } from '../../../src/types/employer-applicants';

function score(overrides: Partial<ApplicantScore> = {}): ApplicantScore {
  return {
    id: 'sc1', score: 82, tier: 'good',
    matchedSkills: ['React', 'TypeScript'], missingSkills: ['Go'], bonusSkills: ['GraphQL'],
    experienceFit: '5 yrs — strong', locationFit: 'Remote — match', noticePeriodFit: '30 days',
    explanation: 'Solid frontend match.', processedAt: 't', processingError: null,
    ...overrides,
  };
}

describe('ApplicantScoreCard', () => {
  it('renders score, tier, skill chips, fit rows and explanation', () => {
    render(<ApplicantScoreCard score={score()} />);
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Notice period')).toBeInTheDocument();
    expect(screen.getByText('5 yrs — strong')).toBeInTheDocument();
    expect(screen.getByText('Solid frontend match.')).toBeInTheDocument();
  });

  it('shows "Not scored" with a pending reason when score is null', () => {
    render(<ApplicantScoreCard score={null} />);
    expect(screen.getByText('Not scored')).toBeInTheDocument();
    expect(screen.getByText(/Scoring pending/)).toBeInTheDocument();
  });

  it('maps a resume processingError to the "Resume unreadable" reason', () => {
    render(<ApplicantScoreCard score={score({ score: 0, tier: 'poor', processingError: 'resume text extraction failed' })} />);
    expect(screen.getByText('Not scored')).toBeInTheDocument();
    expect(screen.getByText(/Resume unreadable/)).toBeInTheDocument();
  });
});
