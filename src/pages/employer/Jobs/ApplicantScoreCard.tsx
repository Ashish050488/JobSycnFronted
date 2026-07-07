// FILE: src/pages/employer/Jobs/ApplicantScoreCard.tsx
// AI score panel: numeric score + tier badge, matched/missing/bonus skill chips
// (R5 colour language), dense fit rows, and the summary — all always visible (P4).
// When no score exists — or scoring errored — it degrades to a "Not scored" card
// with a human reason (D5) instead of a blank space.

import { Card, Badge, Stack } from '../../../components/ui';
import type { ApplicantScore } from '../../../types/employer-applicants';
import { tierBadgeVariant } from './applicant-view-helpers';

const SKILL_LABELS = {
  matched: 'MATCHED',
  missing: 'MISSING',
  bonus: 'BONUS',
} as const;

const FIT_LABELS = {
  experience: 'Experience',
  location: 'Location',
  notice: 'Notice period',
} as const;

/** Human reason for an absent/failed score (D5). */
function notScoredReason(score: ApplicantScore | null): string {
  if (!score) return 'Scoring pending — check back shortly.';
  const error = (score.processingError ?? '').toLowerCase();
  if (error.includes('resume') || error.includes('unreadable') || error.includes('text')) {
    return 'Resume unreadable — the file could not be parsed for scoring.';
  }
  if (error.includes('requirement') || error.includes('job')) {
    return 'Job requirements not extracted yet — scoring will run once they are.';
  }
  return score.processingError || 'Scoring pending — check back shortly.';
}

// Inline category label + chips on one wrapping row (D1/R3): ~24px vs ~48px stacked.
function SkillLine({ label, skills, variant }: {
  label: string; skills: string[]; variant: 'success' | 'warning' | 'info';
}) {
  if (skills.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.03em', color: 'var(--ink-muted)', marginRight: 2 }}>
        {label} ({skills.length})
      </span>
      {skills.map((skill) => <Badge key={skill} variant={variant}>{skill}</Badge>)}
    </div>
  );
}

// Dense 2-col row (D1/R4): label 90px, value flows; ~22px vs ~34px sectioned.
function FitRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', fontSize: '0.85rem', gap: 8, padding: '3px 0' }}>
      <span style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ color: 'var(--ink)' }}>{value || '—'}</span>
    </div>
  );
}

export default function ApplicantScoreCard({ score }: { score: ApplicantScore | null }) {
  if (!score || score.processingError || score.score == null) {
    return (
      <Card padding="sm">
        <Stack gap={8}>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Not scored</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', lineHeight: 1.5, margin: 0 }}>{notScoredReason(score)}</p>
        </Stack>
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <Stack gap={10}>
        <Stack gap={10} dir="row" align="center">
          <span className="font-display" style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>{score.score}</span>
          <Badge variant={tierBadgeVariant(score.tier)}>{score.tier}</Badge>
        </Stack>

        <SkillLine label={SKILL_LABELS.matched} skills={score.matchedSkills} variant="success" />
        <SkillLine label={SKILL_LABELS.missing} skills={score.missingSkills} variant="warning" />
        <SkillLine label={SKILL_LABELS.bonus} skills={score.bonusSkills ?? []} variant="info" />

        <div>
          <FitRow label={FIT_LABELS.experience} value={score.experienceFit} />
          <FitRow label={FIT_LABELS.location} value={score.locationFit} />
          <FitRow label={FIT_LABELS.notice} value={score.noticePeriodFit} />
        </div>

        {score.explanation && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--ink-2)', lineHeight: 1.45, margin: 0 }}>{score.explanation}</p>
        )}
      </Stack>
    </Card>
  );
}
