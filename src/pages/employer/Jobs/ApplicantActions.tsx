// FILE: src/pages/employer/Jobs/ApplicantActions.tsx
// Action panel (D6). Not archived → move-stage (Select + note) and Archive (opens a
// confirm Modal with reason + note). Archived → a single Unarchive button. After any
// mutation we call onDone() so the orchestrator refetches the full detail and the
// stage-history timeline gains the new row (C9). Errors surface inline, never silent.

import { useState } from 'react';
import { Card, Button, Select, Textarea, Modal, Alert, Stack } from '../../../components/ui';
import { moveApplicant, archiveApplicant, unarchiveApplicant, EmployerApplicantsApiError } from '../../../api/employer-applicants-api';
import type { Stage, ArchiveReason } from '../../../types/employer-applicants';

const ACTION_ERROR = 'Something went wrong. Please try again.';

function errorMessage(error: unknown): string {
  return error instanceof EmployerApplicantsApiError ? error.message : ACTION_ERROR;
}

function SectionTitle({ children }: { children: string }) {
  return <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{children}</div>;
}

export default function ApplicantActions({
  applicationId, currentStageId, archived, stages, reasons, onDone,
}: {
  applicationId: string;
  currentStageId: string;
  archived: boolean;
  stages: Stage[];
  reasons: ArchiveReason[];
  onDone: () => Promise<void> | void;
}) {
  const [stageId, setStageId] = useState(currentStageId);
  const [moveNote, setMoveNote] = useState('');
  const [reasonId, setReasonId] = useState(reasons[0]?.id ?? '');
  const [archiveNote, setArchiveNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onDone();
      return true;
    } catch (caught) {
      setError(errorMessage(caught));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirmArchive() {
    const ok = await run(() => archiveApplicant(applicationId, { reasonId, note: archiveNote || undefined }));
    if (ok) { setConfirmOpen(false); setArchiveNote(''); }
  }

  return (
    <Card padding="md">
      <Stack gap={14}>
        <SectionTitle>Actions</SectionTitle>
        {error && <Alert type="error">{error}</Alert>}

        {archived ? (
          <Button variant="secondary" loading={busy} onClick={() => void run(() => unarchiveApplicant(applicationId))}>
            Unarchive applicant
          </Button>
        ) : (
          <>
            <Stack gap={8}>
              <Select
                label="Move to stage"
                value={stageId}
                options={stages.map((stage) => ({ value: stage.id, label: stage.text }))}
                onChange={(event) => setStageId(event.target.value)}
              />
              <Textarea
                label="Note (optional)"
                rows={2}
                value={moveNote}
                onChange={(event) => setMoveNote(event.target.value)}
              />
              <Button
                loading={busy}
                disabled={stageId === currentStageId}
                onClick={() => void run(async () => {
                  await moveApplicant(applicationId, { stageId, note: moveNote || undefined });
                  setMoveNote('');
                })}
              >
                Move stage
              </Button>
            </Stack>

            <Button variant="danger" onClick={() => setConfirmOpen(true)}>Archive applicant</Button>
          </>
        )}
      </Stack>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Archive applicant"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={busy} disabled={!reasonId} onClick={() => void confirmArchive()}>Confirm archive</Button>
          </>
        )}
      >
        <Stack gap={12}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-2)' }}>
            Archiving removes this applicant from the active pipeline. You can unarchive later.
          </p>
          <Select
            label="Reason"
            value={reasonId}
            options={reasons.map((reason) => ({ value: reason.id, label: reason.text }))}
            onChange={(event) => setReasonId(event.target.value)}
          />
          <Textarea
            label="Note (optional)"
            rows={2}
            value={archiveNote}
            onChange={(event) => setArchiveNote(event.target.value)}
          />
        </Stack>
      </Modal>
    </Card>
  );
}
