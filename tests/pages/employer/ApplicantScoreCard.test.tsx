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
  it('renders score, tier, skill chips and fit rows', () => {
    render(<ApplicantScoreCard score={score()} />);
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('good')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('5 yrs — strong')).toBeInTheDocument();
  });

  it('uses the tighter "sm" card padding (P5/D4)', () => {
    const { container } = render(<ApplicantScoreCard score={score()} />);
    expect(container.querySelector('.card')?.getAttribute('style')).toContain('padding: 12px');
  });

  it('renders inline MATCHED/MISSING/BONUS labels with counts (P4.2)', () => {
    render(<ApplicantScoreCard score={score()} />);
    expect(screen.getByText('MATCHED (2)')).toBeInTheDocument();
    expect(screen.getByText('MISSING (1)')).toBeInTheDocument();
    expect(screen.getByText('BONUS (1)')).toBeInTheDocument();
  });

  it('renders a missing fit value as an em dash', () => {
    render(<ApplicantScoreCard score={score({ locationFit: null })} />);
    expect(screen.getByText('Location').parentElement).toHaveTextContent('—');
  });

  it('Summary text is always visible when explanation is present (P4.1 regression undo)', () => {
    render(<ApplicantScoreCard score={score()} />);
    expect(screen.getByText('Solid frontend match.')).toBeInTheDocument();
    // Summary must never become a click again (V8).
    expect(screen.queryByRole('button', { name: /Summary/ })).toBeNull();
    expect(document.querySelector('[aria-expanded]')).toBeNull();
  });

  it('does not render the summary paragraph when there is no explanation', () => {
    render(<ApplicantScoreCard score={score({ explanation: null })} />);
    expect(screen.queryByText('Solid frontend match.')).toBeNull();
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
