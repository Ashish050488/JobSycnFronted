// FILE: tests/pages/employer/ApplicantNotesCard.test.tsx
// Notes sidebar card (C3): mount fetch, empty/error states, the composer gate, and the
// confirmed-append behaviour on save. The api module is mocked wholesale — this asserts
// the card's behaviour, not the transport (that is employer-applicants-api.test.ts).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ApplicantNote } from '../../../src/types/employer-applicants';

const api = vi.hoisted(() => {
  class EmployerApplicantsApiError extends Error {
    status: number; code: string | null;
    constructor(status: number, code: string | null, message: string) {
      super(message); this.status = status; this.code = code;
    }
  }
  return {
    listApplicantNotes: vi.fn(), createApplicantNote: vi.fn(), EmployerApplicantsApiError,
  };
});

vi.mock('../../../src/api/employer-applicants-api', () => api);

import ApplicantNotesCard from '../../../src/pages/employer/Jobs/ApplicantNotesCard';

function note(overrides: Partial<ApplicantNote> = {}): ApplicantNote {
  const createdAt = new Date().toISOString();
  return {
    id: 'n1',
    applicationId: 'a1',
    authorEmployerUserId: 'u1',
    authorName: 'Ada Owner',
    authorEmail: 'owner@acme.com',
    body: 'Strong on backend.',
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

const textarea = () => screen.getByLabelText('Add a note');
const saveButton = () => screen.getByRole('button', { name: /save note/i });

beforeEach(() => {
  api.listApplicantNotes.mockReset();
  api.createApplicantNote.mockReset();
  api.listApplicantNotes.mockResolvedValue([]);
});

describe('ApplicantNotesCard', () => {
  it('fetches on mount and renders the list with author and relative time', async () => {
    api.listApplicantNotes.mockResolvedValue([note({ body: 'Weak on system design.' })]);
    render(<ApplicantNotesCard applicationId="a1" />);
    expect(await screen.findByText('Weak on system design.')).toBeInTheDocument();
    expect(api.listApplicantNotes).toHaveBeenCalledWith('a1');
    // Author snapshot + relative timestamp share one footer line.
    expect(screen.getByText(/Ada Owner/)).toBeInTheDocument();
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });

  it('falls back to the author email when the snapshot has no name', async () => {
    api.listApplicantNotes.mockResolvedValue([note({ authorName: null })]);
    render(<ApplicantNotesCard applicationId="a1" />);
    expect(await screen.findByText(/owner@acme\.com/)).toBeInTheDocument();
  });

  it('shows "No notes yet" for an empty list', async () => {
    render(<ApplicantNotesCard applicationId="a1" />);
    expect(await screen.findByText('No notes yet')).toBeInTheDocument();
  });

  it('shows an inline Alert with Retry when the initial load fails, and recovers', async () => {
    api.listApplicantNotes.mockRejectedValueOnce(new api.EmployerApplicantsApiError(500, null, 'boom'));
    render(<ApplicantNotesCard applicationId="a1" />);
    expect(await screen.findByText('Could not load notes.')).toBeInTheDocument();

    api.listApplicantNotes.mockResolvedValueOnce([note({ body: 'recovered' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('recovered')).toBeInTheDocument();
  });

  it('updates the character counter as the user types', async () => {
    render(<ApplicantNotesCard applicationId="a1" />);
    await screen.findByText('No notes yet');
    expect(screen.getByText('0 / 4000')).toBeInTheDocument();
    fireEvent.change(textarea(), { target: { value: 'hello' } });
    expect(screen.getByText('5 / 4000')).toBeInTheDocument();
  });

  it('disables Save when the body is empty after trimming', async () => {
    render(<ApplicantNotesCard applicationId="a1" />);
    await screen.findByText('No notes yet');
    expect(saveButton()).toBeDisabled();
    fireEvent.change(textarea(), { target: { value: '   \n  ' } }); // whitespace only
    expect(saveButton()).toBeDisabled();
    fireEvent.change(textarea(), { target: { value: 'real note' } });
    expect(saveButton()).toBeEnabled();
  });

  it('disables Save past the 4000-character cap', async () => {
    render(<ApplicantNotesCard applicationId="a1" />);
    await screen.findByText('No notes yet');
    fireEvent.change(textarea(), { target: { value: 'x'.repeat(4000) } });
    expect(saveButton()).toBeEnabled();
    fireEvent.change(textarea(), { target: { value: 'x'.repeat(4001) } });
    expect(saveButton()).toBeDisabled();
  });

  it('disables Save while a save is in flight', async () => {
    let release: (value: ApplicantNote) => void = () => {};
    api.createApplicantNote.mockReturnValue(new Promise<ApplicantNote>((resolve) => { release = resolve; }));
    render(<ApplicantNotesCard applicationId="a1" />);
    await screen.findByText('No notes yet');
    fireEvent.change(textarea(), { target: { value: 'in flight' } });
    fireEvent.click(saveButton());

    await waitFor(() => expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled());
    release(note({ body: 'in flight' }));
    await waitFor(() => expect(saveButton()).toBeInTheDocument());
  });

  it('prepends the created note and clears the textarea on save success', async () => {
    api.listApplicantNotes.mockResolvedValue([note({ id: 'old', body: 'older note' })]);
    api.createApplicantNote.mockResolvedValue(note({ id: 'new', body: 'brand new note' }));
    render(<ApplicantNotesCard applicationId="a1" />);
    await screen.findByText('older note');

    fireEvent.change(textarea(), { target: { value: '  brand new note  ' } });
    fireEvent.click(saveButton());

    expect(await screen.findByText('brand new note')).toBeInTheDocument();
    // The body is trimmed before it is sent — the server would trim it anyway (C7).
    expect(api.createApplicantNote).toHaveBeenCalledWith('a1', { body: 'brand new note' });
    await waitFor(() => expect(textarea()).toHaveValue(''));
    // Newest first: the created note is prepended, not appended, with no refetch (R5).
    const bodies = screen.getAllByText(/^(brand new|older) note$/).map((el) => el.textContent);
    expect(bodies).toEqual(['brand new note', 'older note']);
    expect(api.listApplicantNotes).toHaveBeenCalledTimes(1);
  });

  it('shows an inline Alert and KEEPS the draft when the save fails', async () => {
    api.createApplicantNote.mockRejectedValue(
      new api.EmployerApplicantsApiError(400, 'INVALID_NOTE_BODY', 'Note must be plain text'),
    );
    render(<ApplicantNotesCard applicationId="a1" />);
    await screen.findByText('No notes yet');
    fireEvent.change(textarea(), { target: { value: 'rejected note' } });
    fireEvent.click(saveButton());

    // The server's own message surfaces, so the user learns WHY it was refused.
    expect(await screen.findByText('Note must be plain text')).toBeInTheDocument();
    expect(textarea()).toHaveValue('rejected note'); // content survives the failure (R5)
  });

  it('submits on Cmd/Ctrl+Enter but leaves a bare Enter as a newline', async () => {
    api.createApplicantNote.mockResolvedValue(note({ body: 'via keyboard' }));
    render(<ApplicantNotesCard applicationId="a1" />);
    await screen.findByText('No notes yet');
    fireEvent.change(textarea(), { target: { value: 'via keyboard' } });

    fireEvent.keyDown(textarea(), { key: 'Enter' }); // no modifier → not a submit
    expect(api.createApplicantNote).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea(), { key: 'Enter', metaKey: true });
    await waitFor(() => expect(api.createApplicantNote).toHaveBeenCalledWith('a1', { body: 'via keyboard' }));
  });

  it('does not submit on Cmd/Ctrl+Enter when the body is empty', async () => {
    render(<ApplicantNotesCard applicationId="a1" />);
    await screen.findByText('No notes yet');
    fireEvent.keyDown(textarea(), { key: 'Enter', ctrlKey: true });
    expect(api.createApplicantNote).not.toHaveBeenCalled();
  });
});
