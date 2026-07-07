// FILE: tests/pages/employer/BulkArchiveBar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkArchiveBar from '../../../src/pages/employer/Jobs/BulkArchiveBar';

function renderBar(props: Partial<React.ComponentProps<typeof BulkArchiveBar>> = {}) {
  return render(
    <BulkArchiveBar selectedCount={2} onClear={() => {}} onArchive={() => {}} isSubmitting={false} {...props} />,
  );
}

describe('BulkArchiveBar', () => {
  it('renders nothing when nothing is selected', () => {
    const { container } = renderBar({ selectedCount: 0 });
    expect(container.firstChild).toBeNull();
  });

  it('renders the count and both actions when > 0 selected', () => {
    renderBar({ selectedCount: 3 });
    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive 3' })).toBeInTheDocument();
  });

  it('Clear fires onClear and Archive fires onArchive', () => {
    const onClear = vi.fn(); const onArchive = vi.fn();
    renderBar({ onClear, onArchive });
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    fireEvent.click(screen.getByRole('button', { name: /Archive/ }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onArchive).toHaveBeenCalledTimes(1);
  });

  it('while submitting, Archive is loading/disabled and Clear is disabled', () => {
    renderBar({ isSubmitting: true });
    expect(screen.getByRole('button', { name: /Archive/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('carries an aria-live region for count announcements', () => {
    const { container } = renderBar();
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
});
