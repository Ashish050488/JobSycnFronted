// FILE: tests/components/seeker/ProfileReviewScores.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileReviewScores from '../../../src/components/seeker/ProfileReviewScores';

const scores = { overall: 74, parseability: 85, contentStrength: 70, indiaMarketFit: 55, skillsDepth: 90 };

describe('ProfileReviewScores', () => {
  it('renders all four dimension labels and the overall', () => {
    render(<ProfileReviewScores scores={scores} />);
    expect(screen.getByText('Parseability')).toBeInTheDocument();
    expect(screen.getByText('Content strength')).toBeInTheDocument();
    expect(screen.getByText('India market fit')).toBeInTheDocument();
    expect(screen.getByText('Skills depth')).toBeInTheDocument();
    expect(screen.getByText(/Overall — 74\/100/)).toBeInTheDocument();
  });

  it('applies the colour band per score threshold', () => {
    render(<ProfileReviewScores scores={scores} />);
    const color = (el: HTMLElement) => el.getAttribute('style') ?? '';
    const values = screen.getAllByTestId('score-value');
    // Order: parseability 85 (green), contentStrength 70 (amber), indiaMarketFit 55 (red), skillsDepth 90 (green)
    expect(color(values[0])).toContain('var(--success)');
    expect(color(values[1])).toContain('var(--warning)');
    expect(color(values[2])).toContain('var(--danger)');
    expect(color(values[3])).toContain('var(--success)');
  });
});
