// FILE: tests/pages/employer/BulkArchiveDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ArchiveReason } from '../../../src/types/employer-applicants';
import BulkArchiveDialog from '../../../src/pages/employer/Jobs/BulkArchiveDialog';

const REASONS: ArchiveReason[] = [
  { id: 'r1', text: 'Underqualified', type: 'non-hired', status: 'active' },
  { id: 'r2', text: 'Hired elsewhere', type: 'non-hired', status: 'active' },
];

function renderDialog(props: Partial<React.ComponentProps<typeof BulkArchiveDialog>> = {}) {
  return render(
    <BulkArchiveDialog
      open selectedCount={2} reasons={REASONS} isSubmitting={false}
      onCancel={() => {}} onConfirm={() => {}} {...props}
    />,
  );
}

describe('BulkArchiveDialog', () => {
  it('renders nothing when open=false', () => {
    renderDialog({ open: false });
    expect(screen.queryByText(/Archive 2 applicants\?/)).toBeNull();
  });

  it('shows the count in the title when open', () => {
    renderDialog();
    expect(screen.getByText('Archive 2 applicants?')).toBeInTheDocument();
  });

  it('Confirm is disabled until a reason is selected', () => {
    renderDialog();
    const confirm = screen.getByRole('button', { name: 'Archive 2' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'r1' } });
    expect(confirm).not.toBeDisabled();
  });

  it('Cancel fires onCancel', () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Confirm fires onConfirm with the chosen reason and note', () => {
    const onConfirm = vi.fn();
    renderDialog({ onConfirm });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'r1' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'batch reject' } });
    fireEvent.click(screen.getByRole('button', { name: 'Archive 2' }));
    expect(onConfirm).toHaveBeenCalledWith({ reasonId: 'r1', note: 'batch reject' });
  });

  it('Escape cancels when not submitting', () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Escape does NOT cancel while submitting', () => {
    const onCancel = vi.fn();
    renderDialog({ isSubmitting: true, onCancel });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('default focus lands on Cancel (R3)', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });
});
