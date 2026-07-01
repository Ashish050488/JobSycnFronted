// FILE: tests/pages/public/Privacy.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Privacy from '../../../src/pages/public/Privacy';

function renderPrivacy() {
  return render(<MemoryRouter><Privacy /></MemoryRouter>);
}

describe('Privacy notice page', () => {
  it('renders the "Privacy Notice" heading and Key Points summary', () => {
    renderPrivacy();
    expect(screen.getByRole('heading', { name: 'Privacy Notice' })).toBeInTheDocument();
    expect(screen.getByText('Key Points')).toBeInTheDocument();
    expect(screen.getByText(/deleted after parsing/i)).toBeInTheDocument();
  });

  it('displays the grievance email', () => {
    renderPrivacy();
    expect(screen.getAllByText(/privacy@jobmesh\.in/).length).toBeGreaterThan(0);
  });

  it('contains the cross-border disclosure once its section is expanded', () => {
    renderPrivacy();
    fireEvent.click(screen.getByRole('button', { name: /Cross-border transfer/i }));
    expect(screen.getByText(/hosted outside India/i)).toBeInTheDocument();
  });

  it('renders all 12 section headings', () => {
    renderPrivacy();
    for (let n = 1; n <= 12; n += 1) {
      expect(screen.getByRole('button', { name: new RegExp(`^${n}\\.`) })).toBeInTheDocument();
    }
  });
});
