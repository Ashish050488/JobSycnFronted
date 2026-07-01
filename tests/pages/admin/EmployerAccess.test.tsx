// FILE: tests/pages/admin/EmployerAccess.test.tsx
// Load states + the signup toggle flow. Mutations (add/remove) live in the
// sibling EmployerAccess.mutations.test.tsx to keep each file under 200 lines.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../src/components/ui';
import AdminEmployerAccess from '../../../src/pages/admin/EmployerAccess';

function response(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}
function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => impl(String(url), init)));
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

describe('AdminEmployerAccess — load + toggle', () => {
  it('shows a skeleton while loading', () => {
    mockFetch(() => new Promise<Response>(() => {}));
    const { container } = renderPage();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(screen.queryByText('Global signup')).toBeNull();
  });

  it('shows "Access denied" when the API returns 403', async () => {
    mockFetch(async () => response(403, { error: 'Forbidden', code: 'FORBIDDEN' }));
    renderPage();
    expect(await screen.findByText('Access denied')).toBeInTheDocument();
  });

  it('shows the toggle and whitelist table when loaded', async () => {
    mockFetch(async () => response(200, {
      data: { isEmployerSignupOpen: false, whitelist: [{ email: 'founder@acme.com', note: 'vip', addedAt: '2026-06-01' }] },
    }));
    renderPage();
    expect(await screen.findByText('Global signup')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Employer signup open' })).toBeInTheDocument();
    expect(screen.getByText('founder@acme.com')).toBeInTheDocument();
  });

  it('does NOT flip the switch until the modal is confirmed (R2)', async () => {
    mockFetch(async () => response(200, { data: { isEmployerSignupOpen: false, whitelist: [] } }));
    renderPage();
    const toggle = await screen.findByRole('switch', { name: 'Employer signup open' });
    await userEvent.click(toggle);
    expect(screen.getByText('Open employer signup to everyone?')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Employer signup open' })).toHaveAttribute('aria-checked', 'false');
  });

  it('confirming the toggle calls the API and refetches', async () => {
    let isOpen = false;
    const fetchSpy = vi.fn(async (url: string, init?: RequestInit) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (url.includes('/toggle') && method === 'POST') {
        isOpen = true;
        return response(200, { data: { isEmployerSignupOpen: true, updatedAt: 't' } });
      }
      return response(200, { data: { isEmployerSignupOpen: isOpen, whitelist: [] } });
    });
    vi.stubGlobal('fetch', fetchSpy);
    renderPage();
    await userEvent.click(await screen.findByRole('switch', { name: 'Employer signup open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open signup' }));
    expect(await screen.findByText('Open to everyone')).toBeInTheDocument();
    expect(fetchSpy.mock.calls.some(([url, init]) => String(url).includes('/toggle') && init?.method === 'POST')).toBe(true);
  });
});
