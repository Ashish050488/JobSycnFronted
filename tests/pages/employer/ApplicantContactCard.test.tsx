// FILE: tests/pages/employer/ApplicantContactCard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ApplicantContactCard from '../../../src/pages/employer/Jobs/ApplicantContactCard';

const writeText = vi.fn().mockResolvedValue(undefined);

describe('ApplicantContactCard', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    writeText.mockClear();
  });

  it('renders email as a mailto link and phone as a whitespace-stripped tel link', () => {
    render(<ApplicantContactCard contact={{ email: 'a@b.com', phone: '+91 62070 59522' }} />);
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'a@b.com' })).toHaveAttribute('href', 'mailto:a@b.com');
    // tel: is stripped to digits + leading plus (RFC 3966) while the display keeps spacing.
    expect(screen.getByRole('link', { name: '+91 62070 59522' })).toHaveAttribute('href', 'tel:+916207059522');
  });

  it('puts a copy button on every field', () => {
    render(
      <ApplicantContactCard
        contact={{
          email: 'a@b.com', phone: '+91 62070 59522', linkedinUrl: 'linkedin.com/in/x',
          githubUrl: 'github.com/x', portfolioUrl: 'x.dev', location: 'Pune',
        }}
      />,
    );
    for (const label of ['Copy email', 'Copy phone', 'Copy LinkedIn URL', 'Copy GitHub URL', 'Copy portfolio URL', 'Copy location']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('copy button writes the value to the clipboard and flips to "Copied"', async () => {
    render(<ApplicantContactCard contact={{ phone: '+91 62070 59522' }} />);
    fireEvent.click(screen.getByLabelText('Copy phone'));
    expect(writeText).toHaveBeenCalledWith('+91 62070 59522'); // copies the readable value
    expect(await screen.findByLabelText('Copied phone')).toBeInTheDocument();
  });

  it('LinkedIn / GitHub / portfolio open in a new tab and gain an https prefix', () => {
    render(<ApplicantContactCard contact={{ linkedinUrl: 'linkedin.com/in/adarsh', githubUrl: 'github.com/adarsh', portfolioUrl: 'adarsh.dev' }} />);
    const li = screen.getByRole('link', { name: 'LinkedIn profile' });
    expect(li).toHaveAttribute('href', 'https://linkedin.com/in/adarsh');
    expect(li).toHaveAttribute('target', '_blank');
    expect(li).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'GitHub profile' })).toHaveAttribute('href', 'https://github.com/adarsh');
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', 'https://adarsh.dev');
  });

  it('keeps an existing protocol on a link', () => {
    render(<ApplicantContactCard contact={{ linkedinUrl: 'https://www.linkedin.com/in/x' }} />);
    expect(screen.getByRole('link', { name: 'LinkedIn profile' })).toHaveAttribute('href', 'https://www.linkedin.com/in/x');
  });

  it('renders location text when present', () => {
    render(<ApplicantContactCard contact={{ location: 'Bengaluru, KA' }} />);
    expect(screen.getByText('Bengaluru, KA')).toBeInTheDocument();
  });

  it('does not crash or render when location arrives as a non-string (defensive)', () => {
    // The backend is untyped JS; a {city,state} object must not throw or render.
    const { container } = render(
      <ApplicantContactCard contact={{ location: { city: 'Pune' } as unknown as string }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when there are no contact details', () => {
    const { container } = render(
      <ApplicantContactCard contact={{ email: null, phone: '   ', linkedinUrl: null, location: '' }} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
