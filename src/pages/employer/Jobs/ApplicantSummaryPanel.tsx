// FILE: src/pages/employer/Jobs/ApplicantSummaryPanel.tsx
// Unified applicant summary rail (P6). Replaces the three stacked cards (score / actions /
// stage-history) with one flat, divider-separated panel so combined card chrome stops
// pushing the sidebar past the viewport on 1080p. Content-only compression: fit collapses
// to one line, stage history to one line, move + note share a row. Archive stays a
// confirm Modal (R4, destructive); move is a single non-destructive action (D5/D6).

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Select, Input, Textarea, Modal, Alert, Stack, Badge } from '../../../components/ui';
import { moveApplicant, archiveApplicant, unarchiveApplicant, EmployerApplicantsApiError } from '../../../api/employer-applicants-api';
import type { ApplicantScore, Stage, ArchiveReason, StageChange } from '../../../types/employer-applicants';
import { formatRelativeTime, tierBadgeVariant } from './applicant-view-helpers';

const ACTION_ERROR = 'Something went wrong. Please try again.';
const SKILL_LABELS = { matched: 'Matched skills', missing: 'Missing skills', bonus: 'Bonus skills' } as const;
const EMPTY_VALUE = '—';

function errorMessage(error: unknown): string {
  return error instanceof EmployerApplicantsApiError ? error.message : ACTION_ERROR;
}

const dividerStyle = { borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 14 } as const;

/** Uppercase muted micro-header for a panel section (P7.3/R3). */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
      {children}
    </div>
  );
}

/** Micro-header + a wrapped row of coloured skill chips (P7.1/R1). "None" when empty. */
function SkillLine({ label, skills, variant }: { label: string; skills: string[]; variant: 'success' | 'warning' | 'info' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <SectionLabel>{label} · {skills.length}</SectionLabel>
      {skills.length === 0 ? (
        <div style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>None</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {skills.map((skill) => <Badge key={skill} variant={variant}>{skill}</Badge>)}
        </div>
      )}
    </div>
  );
}

export default function ApplicantSummaryPanel({
  score, applicationId, currentStageId, archived, stages, reasons, stageChanges, onDone,
}: {
  score: ApplicantScore | null;
  applicationId: string;
  currentStageId: string;
  archived: boolean;
  stages: Stage[];
  reasons: ArchiveReason[];
  stageChanges: StageChange[];
  onDone: () => Promise<void> | void;
}) {
  const [stageId, setStageId] = useState(currentStageId);
  const [note, setNote] = useState('');
  const [reasonId, setReasonId] = useState(reasons[0]?.id ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>): Promise<boolean> {
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

  async function handleMoveStage() {
    const ok = await run(() => moveApplicant(applicationId, { stageId, note: note || undefined }));
    if (ok) setNote('');
  }

  async function handleConfirmArchive() {
    const ok = await run(() => archiveApplicant(applicationId, { reasonId, note: note || undefined }));
    if (ok) { setConfirmOpen(false); setNote(''); }
  }

  const hasScore = Boolean(score && score.processingError == null && score.score != null);
  const stageName = (id: string | null): string => (id ? stages.find((s) => s.id === id)?.text ?? EMPTY_VALUE : EMPTY_VALUE);
  const latest = [...stageChanges].sort((a, b) => new Date(b.movedAt ?? 0).getTime() - new Date(a.movedAt ?? 0).getTime())[0];
  const changeCount = stageChanges.length;
  const historyLine = latest
    ? `${stageName(latest.toStageId)} · ${latest.movedAt ? formatRelativeTime(latest.movedAt) : EMPTY_VALUE} · ${changeCount} change${changeCount > 1 ? 's' : ''}`
    : 'No stage changes yet';

  return (
    <div style={{ background: 'var(--paper)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      {/* Section 1 — score header */}
      {hasScore && score ? (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span className="font-display" style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{score.score}</span>
          <Badge variant={tierBadgeVariant(score.tier)}>{score.tier}</Badge>
        </div>
      ) : (
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink-muted)' }}>Not scored yet</div>
      )}

      {/* Section 2 — skills */}
      <div style={dividerStyle}>
        <Stack gap={12}>
          <SkillLine label={SKILL_LABELS.matched} skills={score?.matchedSkills ?? []} variant="success" />
          <SkillLine label={SKILL_LABELS.missing} skills={score?.missingSkills ?? []} variant="warning" />
          <SkillLine label={SKILL_LABELS.bonus} skills={score?.bonusSkills ?? []} variant="info" />
        </Stack>
      </div>

      {/* Section 3 — fit (one line) */}
      <div style={dividerStyle}>
        <Stack gap={4}>
          <SectionLabel>Fit</SectionLabel>
          <div style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.5 }}>
            Experience <span style={{ color: 'var(--ink-muted)' }}>{score?.experienceFit || EMPTY_VALUE}</span>
            {' · '}Location <span style={{ color: 'var(--ink-muted)' }}>{score?.locationFit || EMPTY_VALUE}</span>
            {' · '}Notice period <span style={{ color: 'var(--ink-muted)' }}>{score?.noticePeriodFit || EMPTY_VALUE}</span>
          </div>
        </Stack>
      </div>

      {/* Section 4 — summary */}
      {score?.explanation && (
        <p style={{ ...dividerStyle, fontSize: '0.875rem', lineHeight: 1.55, color: 'var(--ink-2)' }}>{score.explanation}</p>
      )}

      {/* Section 5 — actions */}
      <div style={dividerStyle}>
        <div style={{ marginBottom: 10 }}><SectionLabel>Actions</SectionLabel></div>
        {error && <div style={{ marginBottom: 10 }}><Alert type="error">{error}</Alert></div>}
        {archived ? (
          <Button variant="secondary" loading={busy} onClick={() => void run(() => unarchiveApplicant(applicationId))}>Unarchive applicant</Button>
        ) : (
          <Stack gap={10}>
            <Stack dir="row" gap={12} align="end">
              <div style={{ flex: 1 }}>
                <Select label="Move to:" value={stageId} options={stages.map((s) => ({ value: s.id, label: s.text }))} onChange={(e) => setStageId(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <Input label="Note:" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </Stack>
            <Stack dir="row" gap={12} wrap>
              <Button style={{ flex: 1 }} loading={busy} disabled={stageId === currentStageId} onClick={() => void handleMoveStage()}>Move stage</Button>
              <Button style={{ flex: 1 }} variant="danger" onClick={() => setConfirmOpen(true)}>Archive applicant</Button>
            </Stack>
          </Stack>
        )}
      </div>

      {/* Section 6 — stage history (one line) */}
      <div style={dividerStyle}>
        <Stack gap={4}>
          <SectionLabel>Stage history</SectionLabel>
          <div style={{ fontSize: '0.85rem', color: latest ? 'var(--ink-2)' : 'var(--ink-muted)' }}>{historyLine}</div>
        </Stack>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Archive applicant"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={busy} disabled={!reasonId} onClick={() => void handleConfirmArchive()}>Archive</Button>
          </>
        )}
      >
        <Stack gap={12}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-2)' }}>
            Archiving removes this applicant from the active pipeline. You can unarchive later.
          </p>
          <Select label="Reason" value={reasonId} options={reasons.map((r) => ({ value: r.id, label: r.text }))} onChange={(e) => setReasonId(e.target.value)} />
          <Textarea label="Note (optional)" rows={2} style={{ minHeight: 'auto' }} value={note} onChange={(e) => setNote(e.target.value)} />
        </Stack>
      </Modal>
    </div>
  );
}
