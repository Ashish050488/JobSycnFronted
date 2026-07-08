// FILE: tests/components/seeker/ResumeParsingScreen.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResumeParsingScreen from '../../../src/components/seeker/ResumeParsingScreen';

function renderScreen(props: { errorCode: string | null; errorMessage: string | null }) {
  const onRetry = vi.fn();
  render(
    <MemoryRouter>
      <ResumeParsingScreen errorCode={props.errorCode} errorMessage={props.errorMessage} onRetry={onRetry} />
    </MemoryRouter>,
  );
  return { onRetry };
}

beforeEach(() => vi.clearAllMocks());

describe('ResumeParsingScreen', () => {
  it('errorCode null → renders progress messaging and no Retry button', () => {
    renderScreen({ errorCode: null, errorMessage: null });
    expect(screen.getByText('Parsing your resume…')).toBeInTheDocument();
    expect(screen.getByText(/Usually 15–30 seconds/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('mapped errorCode → renders the friendly copy and Retry fires onRetry', () => {
    const { onRetry } = renderScreen({ errorCode: 'PDF_TEXT_EXTRACTION_FAILED', errorMessage: 'raw' });
    expect(screen.getByText(/it may be scanned or image-based/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('unknown errorCode with a message → falls back to the server message and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderScreen({ errorCode: 'SOMETHING_NEW', errorMessage: 'A brand new server message.' });
    expect(screen.getByText('A brand new server message.')).toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('SOMETHING_NEW'));
    warn.mockRestore();
  });
});
