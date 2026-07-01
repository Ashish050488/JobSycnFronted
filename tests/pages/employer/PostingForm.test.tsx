// FILE: tests/pages/employer/PostingForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostingForm from '../../../src/pages/employer/Jobs/PostingForm';
import { EmployerJobsApiError } from '../../../src/api/employer-jobs-api';

const DESCRIPTION = 'We are hiring a senior engineer to build our applicant tracking system in India.';

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<PostingForm submitLabel="Create posting" onSubmit={onSubmit} />);
  return onSubmit;
}

function setText(label: string, value: string) {
  // Required-field labels carry a trailing "*", so match on a substring.
  fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
}

function setSalary(placeholder: 'Min' | 'Max', value: string) {
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
}

function fillValid() {
  setText('Job title', 'React Developer');
  setText('Workplace type', 'remote');
  setText('Employment type', 'full-time');
  setText('Location', 'Bangalore');
  setText('Job description', DESCRIPTION);
}

const submitButton = () => screen.getByRole('button', { name: 'Create posting' });

beforeEach(() => vi.clearAllMocks());

describe('PostingForm', () => {
  it('keeps submit disabled until all required fields are valid', () => {
    renderForm();
    expect(submitButton()).toBeDisabled();
    fillValid();
    expect(submitButton()).toBeEnabled();
  });

  it('rejects a title under 2 chars without calling onSubmit', async () => {
    const onSubmit = renderForm();
    fillValid();
    setText('Job title', 'a');
    fireEvent.keyDown(screen.getByLabelText('Location', { exact: false }), { key: 'Enter' });
    expect(await screen.findByText(/2.*200 characters/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a description under 50 chars without calling onSubmit', async () => {
    const onSubmit = renderForm();
    fillValid();
    setText('Job description', 'too short');
    fireEvent.keyDown(screen.getByLabelText('Location', { exact: false }), { key: 'Enter' });
    expect(await screen.findByText(/50.*50,000 characters/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a "<script" title client-side', async () => {
    const onSubmit = renderForm();
    fillValid();
    setText('Job title', 'Dev <script>alert(1)</script>');
    fireEvent.click(submitButton());
    expect(await screen.findByText(/2.*200 characters/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a salary error on blur when min > max', async () => {
    renderForm();
    setSalary('Min', '200000');
    setSalary('Max', '100000');
    fireEvent.blur(screen.getByPlaceholderText('Min'));
    expect(await screen.findByText(/less than or equal to maximum/)).toBeInTheDocument();
  });

  it('omits empty salary keys from the payload', async () => {
    const onSubmit = renderForm();
    fillValid();
    fireEvent.click(submitButton());
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
      title: 'React Developer', description: DESCRIPTION, location: 'Bangalore',
      workplaceType: 'remote', employmentType: 'full-time',
    });
  });

  it('submits the full typed input including numeric salaries', async () => {
    const onSubmit = renderForm();
    fillValid();
    setSalary('Min', '100000');
    setSalary('Max', '200000');
    fireEvent.click(submitButton());
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      workplaceType: 'remote', employmentType: 'full-time', salaryMin: 100000, salaryMax: 200000,
    })));
  });

  it('maps a server INVALID_TITLE to the title field only', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new EmployerJobsApiError(400, 'INVALID_TITLE', 'Server says bad title'));
    renderForm(onSubmit);
    fillValid();
    fireEvent.click(submitButton());
    expect(await screen.findByText('Server says bad title')).toBeInTheDocument();
  });

  it('maps an UNKNOWN_FIELD server error to a top-level alert', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new EmployerJobsApiError(400, 'UNKNOWN_FIELD', 'Unknown field: priority'));
    renderForm(onSubmit);
    fillValid();
    fireEvent.click(submitButton());
    expect(await screen.findByText('Unknown field: priority')).toBeInTheDocument();
  });

  it('calls onSubmit exactly once on a rapid double-click', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm(onSubmit);
    fillValid();
    fireEvent.click(submitButton());
    fireEvent.click(submitButton());
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it('submits once on Enter in a text field', async () => {
    const onSubmit = renderForm();
    fillValid();
    fireEvent.keyDown(screen.getByLabelText('Job title', { exact: false }), { key: 'Enter' });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
