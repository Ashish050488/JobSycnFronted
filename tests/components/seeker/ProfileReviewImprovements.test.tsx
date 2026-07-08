// FILE: tests/components/seeker/ProfileReviewImprovements.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileReviewImprovements from '../../../src/components/seeker/ProfileReviewImprovements';

const improvementWithBullet = {
  title: 'Quantify your impact', why: 'Numbers signal scope to recruiters.',
  observedBullet: 'Improved system performance.',
  question: 'By what percentage did performance improve, against what baseline?',
};
const structuralImprovement = {
  title: 'Add a summary', why: 'A summary frames your profile.',
  observedBullet: null, question: 'What is your one-line professional positioning?',
};

describe('ProfileReviewImprovements', () => {
  it('renders strengths as chips', () => {
    render(<ProfileReviewImprovements strengths={['Strong Node.js', 'Fintech domain']} topImprovements={[]} />);
    expect(screen.getByText('Strong Node.js')).toBeInTheDocument();
    expect(screen.getByText('Fintech domain')).toBeInTheDocument();
  });

  it('renders the observed bullet as a blockquote when non-null', () => {
    const { container } = render(<ProfileReviewImprovements strengths={[]} topImprovements={[improvementWithBullet]} />);
    const quote = container.querySelector('blockquote');
    expect(quote).not.toBeNull();
    expect(quote?.textContent).toContain('You wrote:');
    expect(quote?.textContent).toContain('Improved system performance.');
  });

  it('omits the blockquote when observedBullet is null', () => {
    const { container } = render(<ProfileReviewImprovements strengths={[]} topImprovements={[structuralImprovement]} />);
    expect(container.querySelector('blockquote')).toBeNull();
  });

  it('renders the question with an "Answer this:" prefix', () => {
    render(<ProfileReviewImprovements strengths={[]} topImprovements={[improvementWithBullet]} />);
    expect(screen.getByText('Answer this:')).toBeInTheDocument();
    expect(screen.getByText(/By what percentage/)).toBeInTheDocument();
  });

  it('never renders a rewrite/suggested affordance or a textarea (C10)', () => {
    const { container } = render(
      <ProfileReviewImprovements strengths={['x']} topImprovements={[improvementWithBullet, structuralImprovement]} />,
    );
    expect(container.querySelector('textarea')).toBeNull();
    expect(container.textContent?.toLowerCase()).not.toContain('rewrite');
    expect(container.textContent?.toLowerCase()).not.toContain('suggested');
  });
});
