// FILE: src/pages/employer/Jobs/ApplicantCoverNote.tsx
// Candidate's cover note, shown on the applicant detail sidebar. Candidate-voiced
// context the AI summary can't replace (R1): muted + italic to read as a quote,
// pre-wrap so the line breaks they typed survive (R4). Callers render this only
// when the note is a non-empty string — no empty-state placeholder (R3).

import { Card, Stack } from '../../../components/ui';

const LABEL_STYLE = {
  fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
  fontWeight: 600, color: 'var(--ink-muted)',
};
const NOTE_STYLE = {
  margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)',
  fontStyle: 'italic' as const, whiteSpace: 'pre-wrap' as const,
};

export default function ApplicantCoverNote({ coverNote }: { coverNote: string }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <Stack gap={8}>
        <div style={LABEL_STYLE}>Cover note</div>
        <p style={NOTE_STYLE}>&ldquo;{coverNote}&rdquo;</p>
      </Stack>
    </Card>
  );
}
