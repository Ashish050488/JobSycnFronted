// FILE: tests/pages/employer/ApplicantResumeViewer.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ResumeMeta } from '../../../src/types/employer-applicants';

const { refreshResumeUrl } = vi.hoisted(() => ({ refreshResumeUrl: vi.fn() }));
vi.mock('../../../src/api/employer-applicants-api', () => ({ refreshResumeUrl }));

import ApplicantResumeViewer from '../../../src/pages/employer/Jobs/ApplicantResumeViewer';

const META: ResumeMeta = {
  id: 'r1', originalFilename: 'asha-cv.pdf', mimeType: 'application/pdf', sizeBytes: 204800, uploadedAt: 't',
};

beforeEach(() => refreshResumeUrl.mockReset());

describe('ApplicantResumeViewer', () => {
  it('renders an iframe with the zoom fragment appended and fills the viewport', () => {
    const { container } = render(
      <ApplicantResumeViewer applicationId="a1" resumeMeta={META} initialUrl="/api/public/resume-download?token=t1" />,
    );
    const iframe = container.querySelector('iframe');
    expect(iframe?.getAttribute('src')).toBe('/api/public/resume-download?token=t1#zoom=page-width');
    expect(iframe?.style.minHeight).toContain('calc(100vh');
    expect(screen.getByText('asha-cv.pdf')).toBeInTheDocument();
  });

  it('appends the zoom fragment with & when the URL already has a #', () => {
    const { container } = render(
      <ApplicantResumeViewer applicationId="a1" resumeMeta={META} initialUrl="/api/public/resume-download?token=t1#page=2" />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/api/public/resume-download?token=t1#page=2&zoom=page-width');
  });

  it('shows the not-uploaded fallback when there is no resume', () => {
    render(<ApplicantResumeViewer applicationId="a1" resumeMeta={null} initialUrl={null} />);
    expect(screen.getByText('This candidate has not uploaded a resume.')).toBeInTheDocument();
  });

  it('Refresh fetches a new signed URL and swaps the iframe src', async () => {
    refreshResumeUrl.mockResolvedValue({ url: '/api/public/resume-download?token=t2', expiresAt: 'later' });
    const { container } = render(
      <ApplicantResumeViewer applicationId="a1" resumeMeta={META} initialUrl="/api/public/resume-download?token=t1" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    await waitFor(() => expect(refreshResumeUrl).toHaveBeenCalledWith('a1'));
    await waitFor(() => expect(container.querySelector('iframe')?.getAttribute('src')).toBe('/api/public/resume-download?token=t2#zoom=page-width'));
  });
});
