// FILE: tests/pages/seeker/ConsentManager.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { listConsents, withdrawConsent, submitRightsRequest, DpdpApiError } = vi.hoisted(() => {
  class DpdpApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { listConsents: vi.fn(), withdrawConsent: vi.fn(), submitRightsRequest: vi.fn(), DpdpApiError };
});

vi.mock('../../../src/api/dpdp-api', () => ({ listConsents, withdrawConsent, submitRightsRequest, DpdpApiError }));

import { ToastProvider } from '../../../src/components/ui';
import ConsentManager from '../../../src/pages/seeker/ConsentManager';

const ACTIVE = { id: 'a1', purpose: 'resume_parsing', dataItems: ['resume'], grantedAt: '2026-06-01T00:00:00Z', withdrawnAt: null, noticeVersion: 'v1.0-2026-07', method: 'checkbox', crossBorderTransfer: true, createdAt: 't' };
const WITHDRAWN = { ...ACTIVE, id: 'w1', purpose: 'marketing', crossBorderTransfer: false, withdrawnAt: '2026-06-10T00:00:00Z' };

function renderPage() {
  return render(<MemoryRouter><ToastProvider><ConsentManager /></ToastProvider></MemoryRouter>);
}

beforeEach(() => { vi.clearAllMocks(); });

describe('ConsentManager', () => {
  it('renders active consents with a Withdraw button', async () => {
    listConsents.mockResolvedValue([ACTIVE, WITHDRAWN]);
    renderPage();
    expect(await screen.findByText(/parsing your resume/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Withdraw' })).toBeInTheDocument();
    expect(screen.getByText(/privacy@jobmesh\.in/)).toBeInTheDocument();
  });

  it('withdraw confirms, calls the API, refetches and toasts', async () => {
    listConsents.mockResolvedValueOnce([ACTIVE]).mockResolvedValueOnce([{ ...ACTIVE, withdrawnAt: '2026-06-20T00:00:00Z' }]);
    withdrawConsent.mockResolvedValue({ id: 'a1', withdrawnAt: 't' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Withdraw' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Withdraw' }));
    await waitFor(() => expect(screen.getByText('Consent withdrawn')).toBeInTheDocument());
    expect(withdrawConsent).toHaveBeenCalledWith('a1');
    expect(listConsents).toHaveBeenCalledTimes(2);
  });

  it('hides withdrawn consents by default and reveals them on click', async () => {
    listConsents.mockResolvedValue([ACTIVE, WITHDRAWN]);
    renderPage();
    await screen.findByText(/parsing your resume/);
    expect(screen.queryByText(/Withdrawn on/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Show withdrawn consents/ }));
    expect(await screen.findByText(/Withdrawn on/)).toBeInTheDocument();
  });

  it('submits a rights request and toasts the 90-day SLA', async () => {
    listConsents.mockResolvedValue([ACTIVE]);
    submitRightsRequest.mockResolvedValue({ id: 'r1' });
    renderPage();
    await screen.findByText('Your rights');
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));
    await waitFor(() => expect(screen.getByText(/respond within 90 days/)).toBeInTheDocument());
    expect(submitRightsRequest).toHaveBeenCalled();
  });
});
