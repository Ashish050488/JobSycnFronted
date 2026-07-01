// FILE: tests/components/seeker/ResumeUploadZone.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { uploadResume, uploadResumeText, SeekerApiError } = vi.hoisted(() => {
  class SeekerApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) { super(message); this.status = status; this.code = code; }
  }
  return { uploadResume: vi.fn(), uploadResumeText: vi.fn(), SeekerApiError };
});
vi.mock('../../../src/api/seeker-api', () => ({ uploadResume, uploadResumeText, SeekerApiError }));

import ResumeUploadZone from '../../../src/components/seeker/ResumeUploadZone';

const PROFILE = { fullName: 'Asha' };
function renderZone() {
  const onComplete = vi.fn();
  const { container } = render(<ResumeUploadZone onUploadComplete={onComplete} />);
  return { onComplete, container };
}
function pdf(size = 1000) {
  const file = new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}
const fileInput = (c: HTMLElement) => c.querySelector('input[type="file"]') as HTMLInputElement;

beforeEach(() => vi.clearAllMocks());

describe('ResumeUploadZone', () => {
  it('renders the upload tab with the drop-zone text by default', () => {
    renderZone();
    expect(screen.getByText(/Drag and drop your resume PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF only, max 5 MB/i)).toBeInTheDocument();
  });

  it('a valid PDF selection triggers upload and calls onUploadComplete', async () => {
    uploadResume.mockResolvedValue({ profile: PROFILE, isUnchanged: false });
    const { onComplete, container } = renderZone();
    fireEvent.change(fileInput(container), { target: { files: [pdf()] } });
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(PROFILE, false));
    expect(uploadResume).toHaveBeenCalledTimes(1);
  });

  it('a non-PDF file shows a client-side error and makes no API call', async () => {
    const { onComplete, container } = renderZone();
    const txt = new File(['hi'], 'note.txt', { type: 'text/plain' });
    fireEvent.change(fileInput(container), { target: { files: [txt] } });
    expect(await screen.findByText(/choose a PDF file/i)).toBeInTheDocument();
    expect(uploadResume).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('a file over 5MB shows a client-side error and makes no API call', async () => {
    const { container } = renderZone();
    fireEvent.change(fileInput(container), { target: { files: [pdf(6 * 1024 * 1024)] } });
    expect(await screen.findByText(/5MB or smaller/i)).toBeInTheDocument();
    expect(uploadResume).not.toHaveBeenCalled();
  });

  it('an upload error shows an Alert with a Try again action', async () => {
    uploadResume.mockRejectedValue(new SeekerApiError(503, 'GEMMA_UNAVAILABLE', 'Resume parsing is temporarily unavailable.'));
    const { container } = renderZone();
    fireEvent.change(fileInput(container), { target: { files: [pdf()] } });
    expect(await screen.findByText('Resume parsing is temporarily unavailable.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.queryByText('Resume parsing is temporarily unavailable.')).toBeNull());
  });

  it('paste tab: the parse button is disabled for short text and calls the API for valid text', async () => {
    uploadResumeText.mockResolvedValue({ profile: PROFILE, isUnchanged: false });
    const { onComplete } = renderZone();
    fireEvent.click(screen.getByRole('tab', { name: 'Paste text' }));
    const button = screen.getByRole('button', { name: 'Parse resume' });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Resume text/i), { target: { value: 'x'.repeat(250) } });
    expect(screen.getByRole('button', { name: 'Parse resume' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Parse resume' }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(PROFILE, false));
    expect(uploadResumeText).toHaveBeenCalledWith('x'.repeat(250));
  });
});
