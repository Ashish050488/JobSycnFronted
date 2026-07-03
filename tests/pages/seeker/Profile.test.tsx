// FILE: tests/pages/seeker/Profile.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const {
  fetchProfile, patchProfile, SeekerApiError,
  fetchResumeReview, runResumeReview, fetchMatchCount, fetchSalaryBenchmark,
} = vi.hoisted(() => {
  class SeekerApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return {
    fetchProfile: vi.fn(), patchProfile: vi.fn(), SeekerApiError,
    fetchResumeReview: vi.fn(), runResumeReview: vi.fn(),
    fetchMatchCount: vi.fn(), fetchSalaryBenchmark: vi.fn(),
  };
});
vi.mock('../../../src/api/seeker-api', () => ({
  fetchProfile, patchProfile, SeekerApiError,
  fetchResumeReview, runResumeReview, fetchMatchCount, fetchSalaryBenchmark,
}));

import Profile from '../../../src/pages/seeker/Profile';

const PROFILE = {
  fullName: 'Asha Rao', email: 'asha@x.com', phone: '+91 90000', currentLocation: { city: 'Bengaluru', state: 'KA' },
  linkedinUrl: null, summary: 'Backend engineer.', experience: [], education: [],
  skills: [{ name: 'Node.js', category: null, proficiency: null }], totalExperienceYears: 5,
  seniorityLevel: 'Senior', domain: 'Fintech', subDomain: null, currentCTC: { amount: 24, currency: 'INR' },
  expectedCTC: null, noticePeriod: '30 days', languages: [], certifications: [], projects: [], parsedAt: new Date().toISOString(),
};

function renderPage() { return render(<MemoryRouter><Profile /></MemoryRouter>); }
beforeEach(() => {
  vi.clearAllMocks();
  // Default the F3c card fetches so the two new cards settle without errors.
  fetchResumeReview.mockResolvedValue(null);
  runResumeReview.mockResolvedValue(null);
  fetchMatchCount.mockResolvedValue({ count: 0, breakdown: { byLocation: [], byRoleCategory: [] }, asOf: new Date().toISOString() });
  fetchSalaryBenchmark.mockResolvedValue({ p25: null, p50: null, p75: null, sampleSize: 0, currency: 'INR', unit: 'LPA', filters: { seniority: null, roleCategory: null, location: null }, asOf: new Date().toISOString() });
});

describe('Profile page', () => {
  it('shows the upload CTA when there is no profile', async () => {
    fetchProfile.mockResolvedValue(null);
    renderPage();
    expect(await screen.findByText('No profile yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Upload your resume/i })).toHaveAttribute('href', '/resume');
  });

  it('renders the profile sections when loaded', async () => {
    fetchProfile.mockResolvedValue(PROFILE);
    renderPage();
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Re-upload resume/i })).toHaveAttribute('href', '/resume');
  });

  it('renders the review + market cards above the existing sections', async () => {
    fetchProfile.mockResolvedValue(PROFILE);
    renderPage();
    await screen.findByText('Asha Rao');
    // Review card: no review yet → its empty-state CTA is present.
    expect(await screen.findByRole('button', { name: 'Run review' })).toBeInTheDocument();
    // Market card header renders; existing sections still render below.
    expect(await screen.findByText('Market snapshot')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
  });

  it('editing Contact shows inputs and Save calls patchProfile', async () => {
    fetchProfile.mockResolvedValue(PROFILE);
    patchProfile.mockResolvedValue({ ...PROFILE, fullName: 'Asha R' });
    renderPage();
    await screen.findByText('Asha Rao');
    const contactCard = screen.getByText('Contact').closest('.card') as HTMLElement;
    fireEvent.click(contactCard.querySelector('button')!); // Edit
    const nameInput = await screen.findByLabelText('Full name');
    fireEvent.change(nameInput, { target: { value: 'Asha R' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(patchProfile).toHaveBeenCalled());
    expect(patchProfile.mock.calls[0][0]).toMatchObject({ fullName: 'Asha R' });
  });

  it('shows an Alert when a PATCH fails', async () => {
    fetchProfile.mockResolvedValue(PROFILE);
    patchProfile.mockRejectedValue(new SeekerApiError(400, 'UNKNOWN_FIELD', 'Unknown field'));
    renderPage();
    await screen.findByText('Asha Rao');
    const contactCard = screen.getByText('Contact').closest('.card') as HTMLElement;
    fireEvent.click(contactCard.querySelector('button')!);
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Unknown field')).toBeInTheDocument();
  });
});
