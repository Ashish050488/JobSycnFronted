// FILE: tests/pages/employer/DetailSettings.test.tsx
// Renders DetailSettings directly. useEmployer is mocked (company.slug); global
// fetch is stubbed so update/close/reopen run the real api client. onReload is a
// spy — the page owns the refetch, here we only assert it is invoked.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import type { EmployerCtx } from '../../../src/context/employer/employer-context-types';
import { ToastProvider } from '../../../src/components/ui';

const ctxValue = { company: { slug: 'acme' } } as unknown as EmployerCtx;
vi.mock('../../../src/context/employer/EmployerContext', () => ({ useEmployer: () => ctxValue }));

import DetailSettings from '../../../src/pages/employer/Jobs/DetailSettings';

const BASE = {
  id: 'p1', slug: 'react-dev', title: 'React Developer',
  description: 'We are hiring a senior engineer to build our applicant tracking system in India.',
  descriptionPlain: 'x', location: 'Bangalore', workplaceType: 'remote', employmentType: 'full-time',
  salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active',
  postedAt: '2026-06-29T00:00:00Z', createdAt: '2026-06-28T00:00:00Z', updatedAt: '2026-06-30T00:00:00Z',
};

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
function stubFetch(impl: () => Promise<Response>) { vi.stubGlobal('fetch', vi.fn(impl)); }

let onReload: ReturnType<typeof vi.fn>;
const writeText = vi.fn().mockResolvedValue(undefined);

function renderSettings(overrides: Record<string, unknown> = {}) {
  onReload = vi.fn(async () => {});
  return render(
    <ToastProvider>
      <DetailSettings posting={{ ...BASE, ...overrides } as never} onReload={onReload} />
    </ToastProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.clearAllMocks();
  writeText.mockClear().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

describe('DetailSettings', () => {
  it('view mode shows Edit and Close for an active posting', () => {
    stubFetch(async () => response(200, { posting: BASE }));
    renderSettings();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close posting' })).toBeInTheDocument();
  });

  it('copies the apply URL and toasts success', async () => {
    stubFetch(async () => response(200, { posting: BASE }));
    renderSettings();
    expect(screen.getByText(`${window.location.origin}/apply/acme/react-dev`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(screen.getByText('Apply URL copied to clipboard.')).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/apply/acme/react-dev`);
  });

  it('toasts a fallback message when clipboard write fails', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    stubFetch(async () => response(200, { posting: BASE }));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    await waitFor(() => expect(screen.getByText(/Could not copy/)).toBeInTheDocument());
  });

  it('Edit toggles into the form and Cancel returns to view', () => {
    stubFetch(async () => response(200, { posting: BASE }));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('Save updates, toasts, reloads and returns to view', async () => {
    stubFetch(async () => response(200, { posting: BASE }));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.getByText('Changes saved')).toBeInTheDocument());
    expect(onReload).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('closed posting shows Reopen and hides the apply URL', () => {
    stubFetch(async () => response(200, { posting: BASE }));
    renderSettings({ status: 'closed' });
    expect(screen.getByRole('button', { name: 'Reopen posting' })).toBeInTheDocument();
    expect(screen.getByText(/Not currently accepting applications/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy' })).toBeNull();
  });

  it('Close: opens confirm, Escape cancels without mutating, Confirm closes and reloads', async () => {
    const fetchSpy = vi.fn(async () => response(200, { posting: { ...BASE, status: 'closed' } }));
    vi.stubGlobal('fetch', fetchSpy);
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Close posting' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Close posting' })).not.toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Close posting' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close posting' }));
    await waitFor(() => expect(screen.getByText('Posting closed')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith('/api/employer/jobs/p1/close', expect.objectContaining({ method: 'POST' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('Reopen: confirm calls the reopen endpoint and reloads', async () => {
    const fetchSpy = vi.fn(async () => response(200, { posting: { ...BASE, status: 'active' } }));
    vi.stubGlobal('fetch', fetchSpy);
    renderSettings({ status: 'closed' });
    fireEvent.click(screen.getByRole('button', { name: 'Reopen posting' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reopen posting' }));
    await waitFor(() => expect(screen.getByText('Posting reopened')).toBeInTheDocument());
    expect(fetchSpy).toHaveBeenCalledWith('/api/employer/jobs/p1/reopen', expect.objectContaining({ method: 'POST' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('a server error during confirm toasts and keeps the modal open', async () => {
    stubFetch(async () => response(409, { error: 'Already closed', code: 'INVALID_STATE' }));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Close posting' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close posting' }));
    await waitFor(() => expect(screen.getByText('Already closed')).toBeInTheDocument());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onReload).not.toHaveBeenCalled();
  });
});
