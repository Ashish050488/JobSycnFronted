// FILE: tests/components/shared/ConsentGate.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { listConsents, grantConsent, fetchNoticeVersion, DpdpApiError } = vi.hoisted(() => {
  class DpdpApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { listConsents: vi.fn(), grantConsent: vi.fn(), fetchNoticeVersion: vi.fn(), DpdpApiError };
});

vi.mock('../../../src/api/dpdp-api', () => ({ listConsents, grantConsent, fetchNoticeVersion, DpdpApiError }));

import ConsentGate from '../../../src/components/shared/ConsentGate';

const PROPS = {
  purpose: 'resume_parsing' as const,
  dataItems: ['resume text', 'contact info'],
  crossBorderTransfer: true,
  title: 'Resume parsing consent',
  description: 'We parse your resume to build your profile.',
};

function renderGate() {
  return render(<ConsentGate {...PROPS}><div>PROTECTED</div></ConsentGate>);
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchNoticeVersion.mockResolvedValue({ version: 'v1.0-2026-07', policyUrl: '/legal/privacy', grievanceEmail: 'privacy@jobmesh.in', crossBorderEnabled: true });
});

describe('ConsentGate', () => {
  it('renders children immediately when active consent exists', async () => {
    listConsents.mockResolvedValue([{ purpose: 'resume_parsing', withdrawnAt: null }]);
    renderGate();
    expect(await screen.findByText('PROTECTED')).toBeInTheDocument();
  });

  it('shows the consent card (children hidden) when no consent', async () => {
    listConsents.mockResolvedValue([]);
    renderGate();
    expect(await screen.findByText('Resume parsing consent')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED')).toBeNull();
  });

  it('checkbox starts unchecked and the agree button is disabled', async () => {
    listConsents.mockResolvedValue([]);
    renderGate();
    await screen.findByText('Resume parsing consent');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'I agree' })).toBeDisabled();
  });

  it('checking the checkbox enables the agree button', async () => {
    listConsents.mockResolvedValue([]);
    renderGate();
    await screen.findByText('Resume parsing consent');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'I agree' })).toBeEnabled();
  });

  it('clicking "I agree" grants with the correct payload, then reveals children', async () => {
    listConsents.mockResolvedValue([]);
    grantConsent.mockResolvedValue({ id: 'c1' });
    renderGate();
    await screen.findByText('Resume parsing consent');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'I agree' }));
    await waitFor(() => expect(screen.getByText('PROTECTED')).toBeInTheDocument());
    expect(grantConsent).toHaveBeenCalledWith({
      purpose: 'resume_parsing', dataItems: ['resume text', 'contact info'],
      noticeVersion: 'v1.0-2026-07', method: 'checkbox', crossBorderTransfer: true,
    });
  });

  it('shows an Alert and keeps children hidden when grant fails', async () => {
    listConsents.mockResolvedValue([]);
    grantConsent.mockRejectedValue(new DpdpApiError(400, 'INVALID_NOTICE_VERSION', 'Stale notice'));
    renderGate();
    await screen.findByText('Resume parsing consent');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'I agree' }));
    expect(await screen.findByText('Stale notice')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED')).toBeNull();
  });

  it('renders children for an anonymous caller (401 → passive gate)', async () => {
    listConsents.mockRejectedValue(new DpdpApiError(401, null, 'Unauthorized'));
    renderGate();
    expect(await screen.findByText('PROTECTED')).toBeInTheDocument();
  });
});
