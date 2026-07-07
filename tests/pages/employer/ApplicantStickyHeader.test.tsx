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
});
