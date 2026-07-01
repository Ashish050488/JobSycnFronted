// FILE: tests/components/shared/ShipsNext.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ShipsNext from '../../../src/components/shared/ShipsNext';

function renderShim() {
  return render(
    <MemoryRouter initialEntries={['/employer/jobs/new']}>
      <Routes>
        <Route path="/employer/jobs/new" element={<ShipsNext label="New posting" />} />
        <Route path="/employer/jobs" element={<div>POSTINGS LIST</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ShipsNext', () => {
  it('renders the provided label', () => {
    renderShim();
    expect(screen.getByText('New posting')).toBeInTheDocument();
  });

  it('"Back to postings" navigates to /employer/jobs', () => {
    renderShim();
    fireEvent.click(screen.getByRole('button', { name: 'Back to postings' }));
    expect(screen.getByText('POSTINGS LIST')).toBeInTheDocument();
  });
});
