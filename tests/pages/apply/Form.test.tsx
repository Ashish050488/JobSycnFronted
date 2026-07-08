// FILE: tests/pages/apply/Form.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const { fetchPublicJob, submitApplication, PublicApiError } = vi.hoisted(() => {
  class PublicApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { fetchPublicJob: vi.fn(), submitApplication: vi.fn(), PublicApiError };
});
vi.mock('../../../src/api/public-api', () => ({ fetchPublicJob, submitApplication, PublicApiError }));

import ApplyForm from '../../../src/pages/apply/Form';

const JOB = { company: { name: 'Acme', slug: 'acme', website: null, logoUrl: null }, job: { id: 'j1', slug: 'react-dev', title: 'React Developer', description: 'Build UIs', location: 'Bengaluru', workplaceType: 'remote', employmentType: 'full-time', salaryMin: null, salaryMax: null, salaryCurrency: 'INR', postedAt: null } };

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/apply/acme/react-dev']}>
      <Routes>
        <Route path="/apply/:companySlug/:jobSlug" element={<ApplyForm />} />
        <Route path="/apply/:companySlug/:jobSlug/success" element={<div>SUCCESS PAGE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });
function attachResume(container: HTMLElement) {
  const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: 1000 });
  fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, { target: { files: [file] } });
}
async function fillValid(container: HTMLElement) {
  await screen.findByRole('heading', { name: 'React Developer' });
  type('First name', 'Asha'); type('Last name', 'Rao'); type('Email', 'asha@x.com');
  attachResume(container);
  fireEvent.click(screen.getByRole('checkbox', { name: /processing my data/i }));
}

beforeEach(() => vi.clearAllMocks());

describe('ApplyForm page', () => {
  it('shows a loading skeleton while fetching the job', () => {
    fetchPublicJob.mockReturnValue(new Promise(() => {}));
    const { container } = renderForm();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('shows a "no longer accepting" message on 404', async () => {
    fetchPublicJob.mockRejectedValue(new PublicApiError(404, 'POSTING_NOT_FOUND', 'gone'));
    renderForm();
    expect(await screen.findByText(/no longer accepting applications/i)).toBeInTheDocument();
  });

  it('keeps submit disabled until required fields are filled', async () => {
    fetchPublicJob.mockResolvedValue(JOB);
    const { container } = renderForm();
    await screen.findByRole('heading', { name: 'React Developer' });
    expect(screen.getByRole('button', { name: 'Submit application' })).toBeDisabled();
    await fillValid(container);
    expect(screen.getByRole('button', { name: 'Submit application' })).toBeEnabled();
  });

  it('shows an inline error on blur for empty first name and invalid email', async () => {
    fetchPublicJob.mockResolvedValue(JOB);
    renderForm();
    await screen.findByRole('heading', { name: 'React Developer' });
    fireEvent.blur(screen.getByLabelText('First name', { exact: false }));
    expect(await screen.findByText(/First name is required/i)).toBeInTheDocument();
    type('Email', 'notanemail');
    fireEvent.blur(screen.getByLabelText('Email', { exact: false }));
    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
  });

  it('submits FormData with all fields + honeypot + resume, then navigates to success', async () => {
    fetchPublicJob.mockResolvedValue(JOB);
    submitApplication.mockResolvedValue({ applicationId: 'a1' });
    const { container } = renderForm();
    await fillValid(container);
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(await screen.findByText('SUCCESS PAGE')).toBeInTheDocument();
    const form = submitApplication.mock.calls[0][2] as FormData;
    expect(form.get('firstName')).toBe('Asha');
    expect(form.get('consent_dpdp')).toBe('true');
    expect(form.get('website_url')).toBe('');
    expect(form.get('resume')).toBeInstanceOf(File);
    // P9: the removed field is no longer sent (backend stores null).
    expect(form.has('yearsExperience')).toBe(false);
  });

  it('does not render a "Years of experience" field and still submits (P9)', async () => {
    fetchPublicJob.mockResolvedValue(JOB);
    submitApplication.mockResolvedValue({ applicationId: 'a1' });
    const { container } = renderForm();
    await screen.findByRole('heading', { name: 'React Developer' });
    expect(screen.queryByLabelText('Years of experience', { exact: false })).toBeNull();
    await fillValid(container);
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(await screen.findByText('SUCCESS PAGE')).toBeInTheDocument();
    expect((submitApplication.mock.calls[0][2] as FormData).has('yearsExperience')).toBe(false);
  });

  it('maps a server field error onto the field', async () => {
    fetchPublicJob.mockResolvedValue(JOB);
    submitApplication.mockRejectedValue(new PublicApiError(400, 'INVALID_EMAIL', 'That email is invalid.'));
    const { container } = renderForm();
    await fillValid(container);
    fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
    expect(await screen.findByText('That email is invalid.')).toBeInTheDocument();
    expect(screen.queryByText('SUCCESS PAGE')).toBeNull();
  });
});

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth;
const DEFAULT_VIEWPORT_HEIGHT = window.innerHeight;
const setViewport = (width: number) => {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
};
afterEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: DEFAULT_VIEWPORT_WIDTH, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: DEFAULT_VIEWPORT_HEIGHT, configurable: true });
});
const jobWithSalary = (salaryMin: number | null, salaryMax: number | null) => ({
  ...JOB, job: { ...JOB.job, salaryMin, salaryMax },
});

describe('ApplyForm layout (P-APPLY.1)', () => {
  it('desktop (>900px): centred max-width wrapper, not a Container size="sm"', async () => {
    setViewport(1920);
    fetchPublicJob.mockResolvedValue(JOB);
    const { container } = renderForm();
    await screen.findByRole('heading', { name: 'React Developer' });
    const wrapper = container.querySelector('div[style*="max-width: 1400px"]') as HTMLElement;
    expect(wrapper).toBeTruthy();
    // Container size="sm" renders a 640px max-width; it must be gone.
    expect(container.querySelector('div[style*="max-width: 640px"]')).toBeNull();
  });

  it('desktop: two-column grid with a sticky form column', async () => {
    setViewport(1920);
    fetchPublicJob.mockResolvedValue(JOB);
    const { container } = renderForm();
    await screen.findByRole('heading', { name: 'React Developer' });
    const grid = container.querySelector('div[style*="grid-template-columns"]') as HTMLElement;
    expect(grid).toBeTruthy();
    expect(grid.getAttribute('style')).toContain('1.5fr');
    expect(grid.getAttribute('style')).toContain('minmax(360px');
    expect(container.querySelector('div[style*="position: sticky"]')).toBeTruthy();
  });

  it('mobile (≤900px): single-column stack, no grid', async () => {
    setViewport(600);
    fetchPublicJob.mockResolvedValue(JOB);
    const { container } = renderForm();
    await screen.findByRole('heading', { name: 'React Developer' });
    expect(container.querySelector('div[style*="grid-template-columns"]')).toBeNull();
    expect(container.querySelector('div[style*="position: sticky"]')).toBeNull();
  });
});

describe('ApplyForm salary meta line (P-APPLY.2)', () => {
  it('shows a range when both bounds are present', async () => {
    setViewport(1920);
    fetchPublicJob.mockResolvedValue(jobWithSalary(5, 9));
    renderForm();
    expect(await screen.findByText(/₹5-9 LPA/)).toBeInTheDocument();
  });

  it('shows a "+" form when only the minimum is present', async () => {
    setViewport(1920);
    fetchPublicJob.mockResolvedValue(jobWithSalary(5, null));
    renderForm();
    expect(await screen.findByText(/₹5\+ LPA/)).toBeInTheDocument();
  });

  it('omits salary entirely when both bounds are null', async () => {
    setViewport(1920);
    fetchPublicJob.mockResolvedValue(jobWithSalary(null, null));
    renderForm();
    await screen.findByRole('heading', { name: 'React Developer' });
    expect(screen.queryByText(/₹/)).toBeNull();
    expect(screen.queryByText(/LPA/)).toBeNull();
  });
});
