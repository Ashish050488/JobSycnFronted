// FILE: tests/components/employer/JobDescriptionTextarea.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobDescriptionTextarea } from '../../../src/components/employer/JobDescriptionTextarea';

describe('JobDescriptionTextarea', () => {
  it('renders the provided value and propagates onChange', () => {
    const handleChange = vi.fn();
    render(
      <JobDescriptionTextarea label="Job description" value="Initial JD" onChange={handleChange} />,
    );
    const field = screen.getByLabelText('Job description') as HTMLTextAreaElement;
    expect(field.value).toBe('Initial JD');
    fireEvent.change(field, { target: { value: 'Updated JD' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('respects maxLength and reflects the error via aria-invalid', () => {
    render(
      <JobDescriptionTextarea
        label="Job description" value="" onChange={() => {}} maxLength={500} error="Too short"
      />,
    );
    const field = screen.getByLabelText('Job description');
    expect(field).toHaveAttribute('maxlength', '500');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });
});
