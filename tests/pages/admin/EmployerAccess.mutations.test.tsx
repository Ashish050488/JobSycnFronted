// FILE: tests/pages/admin/EmployerAccess.mutations.test.tsx
// Whitelist add + remove flows for the admin Employer Access page.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../src/components/ui';
import AdminEmployerAccess from '../../../src/pages/admin/EmployerAccess';

const ENTRY = { email: 'founder@acme.com', note: 'vip', addedAt: '2026-06-01' };

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/admin/employer-access']}>
        <AdminEmployerAccess />
      </MemoryRouter>
    </ToastProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('AdminEmployerAccess — mutations', () => {
  it('rejects an invalid email inline and does not call the API (R4)', async () => {
    const fetchSpy = vi.fn(async () => response(200, { data: { isEmployerSignupOpen: false, whitelist: [] } }));
    vi.stubGlobal('fetch', fetchSpy);
    renderPage();
    await screen.findByText('Whitelist');
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Add to whitelist' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(fetchSpy.mock.calls.some(([, init]) => (init?.method || 'GET') === 'POST')).toBe(false);
  });

  it('add happy path refetches and clears the inputs', async () => {
    let added = false;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (String(url).includes('/whitelist') && method === 'POST') {
        added = true;
        return response(200, { data: ENTRY });
      }
      return response(200, { data: { isEmployerSignupOpen: false, whitelist: added ? [ENTRY] : [] } });
    }));
    renderPage();
    await screen.findByText('Whitelist');
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    await userEvent.type(emailInput, 'founder@acme.com');
    await userEvent.click(screen.getByRole('button', { name: 'Add to whitelist' }));
    expect(await screen.findByText('founder@acme.com')).toBeInTheDocument();
    expect(emailInput.value).toBe('');
  });

  it('remove opens a modal; confirming calls the API and refetches', async () => {
    let removed = false;
    const fetchSpy = vi.fn(async (url: string, init?: RequestInit) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (String(url).includes('/whitelist/') && method === 'DELETE') {
        removed = true;
        return response(200, { data: { deleted: true } });
      }
      return response(200, { data: { isEmployerSignupOpen: false, whitelist: removed ? [] : [ENTRY] } });
    });
    vi.stubGlobal('fetch', fetchSpy);
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(screen.getByText('Remove from whitelist?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove founder@acme.com' }));
    expect(await screen.findByText('No whitelisted emails yet')).toBeInTheDocument();
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);
  });
});
