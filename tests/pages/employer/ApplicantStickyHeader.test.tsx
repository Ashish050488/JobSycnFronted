// FILE: tests/pages/employer/ApplicantStickyHeader.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ApplicantStickyHeader from '../../../src/pages/employer/Jobs/ApplicantStickyHeader';

function renderHeader(props: Partial<React.ComponentProps<typeof ApplicantStickyHeader>> = {}) {
  return render(
    <MemoryRouter>
      <ApplicantStickyHeader
        backHref="/employer/jobs/p1?tab=ranked"
        backLabel="Back to Ranked"
        candidateName="Asha Rao"
        candidateEmail="asha@x.com"
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('ApplicantStickyHeader', () => {
  it('renders the back link with its href and label', () => {
    renderHeader();
    const link = screen.getByRole('link', { name: /Back to Ranked/ });
    expect(link).toHaveAttribute('href', '/employer/jobs/p1?tab=ranked');
  });

  it('renders the candidate name and email', () => {
    renderHeader();
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('asha@x.com')).toBeInTheDocument();
  });

  it('renders a null email safely — no crash, no literal "null"', () => {
    renderHeader({ candidateEmail: null });
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.queryByText('null')).toBeNull();
  });

  it('renders the ArrowLeft icon inside the back link', () => {
    const { container } = renderHeader();
    expect(container.querySelector('a svg')).not.toBeNull();
  });

  it('renders prev/next links and position text when provided (PP2)', () => {
    renderHeader({ previousHref: '/prev?from=ranked', nextHref: '/next?from=ranked', positionText: '2 of 3' });
    const prev = screen.getByRole('link', { name: 'Previous applicant' });
    const next = screen.getByRole('link', { name: 'Next applicant' });
    expect(prev).toHaveAttribute('href', '/prev?from=ranked');
    expect(next).toHaveAttribute('href', '/next?from=ranked');
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });

  it('renders a disabled Previous button (not a link) when previousHref is null', () => {
    renderHeader({ previousHref: null, nextHref: '/next', positionText: '1 of 3' });
    const prev = screen.getByRole('button', { name: 'Previous applicant' });
    expect(prev).toBeDisabled();
    expect(screen.queryByRole('link', { name: 'Previous applicant' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Next applicant' })).toBeInTheDocument();
  });

  it('renders NO right cluster when none of the PP2 props are passed (P2 backward compat)', () => {
    renderHeader();
    expect(screen.queryByRole('link', { name: 'Previous applicant' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Previous applicant' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next applicant' })).toBeNull();
  });
});
