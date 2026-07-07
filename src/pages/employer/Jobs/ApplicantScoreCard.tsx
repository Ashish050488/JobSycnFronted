// FILE: src/pages/employer/Jobs/ApplicantScoreCard.tsx
// AI score panel: numeric score + tier badge, matched/missing/bonus skill chips
// (R5 colour language), the fit rows (experience / location / notice period), and
// the explanation. When no score exists — or scoring errored — it degrades to a
// "Not scored" card with a human reason (D5) instead of a blank space.

import type { ReactNode } from 'react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, Badge, Stack } from '../../../components/ui';
import type { ApplicantScore } from '../../../types/employer-applicants';
import { tierBadgeVariant } from './applicant-view-helpers';

const SUMMARY_LABEL = 'Summary';
const SUMMARY_CONTENT_ID = 'applicant-summary';

/** Collapsible trigger button — a real button with aria-expanded/-controls (R3). */
function CollapseTrigger({ label, isOpen, controlsId, onToggle }: {
  label: string; isOpen: boolean; controlsId: string; onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={controlsId}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        width: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
        fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-muted)',
      }}
    >
      {label}
      <ChevronDown size={16} aria-hidden style={{ transition: 'transform 180ms ease', transform: `rotate(${isOpen ? 90 : 0}deg)` }} />
    </button>
  );
}

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

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{children}</div>
  );
}

function SkillChips({ label, skills, variant }: { label: string; skills: string[]; variant: 'success' | 'warning' | 'info' }) {
  if (skills.length === 0) return null;
  return (
    <Stack gap={6}>
      <SectionTitle>{label}</SectionTitle>
      <Stack gap={6} dir="row" wrap>
        {skills.map((skill) => <Badge key={skill} variant={variant}>{skill}</Badge>)}
      </Stack>
    </Stack>
  );
}

function FitRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <Stack gap={12} dir="row" align="baseline" justify="space-between">
      <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--ink)', textAlign: 'right' }}>{value || '—'}</span>
    </Stack>
  );
}

export default function ApplicantScoreCard({ score }: { score: ApplicantScore | null }) {
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  if (!score || score.processingError || score.score == null) {
    return (
      <Card padding="md">
        <Stack gap={8}>
          <SectionTitle>AI score</SectionTitle>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Not scored</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', lineHeight: 1.5, margin: 0 }}>{notScoredReason(score)}</p>
        </Stack>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <Stack gap={16}>
        <Stack gap={10} dir="row" align="center">
          <span className="font-display" style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>{score.score}</span>
          <Badge variant={tierBadgeVariant(score.tier)}>{score.tier}</Badge>
        </Stack>

        <SkillChips label="Matched skills" skills={score.matchedSkills} variant="success" />
        <SkillChips label="Missing skills" skills={score.missingSkills} variant="warning" />
        <SkillChips label="Bonus skills" skills={score.bonusSkills ?? []} variant="info" />

        <Stack gap={8}>
          <SectionTitle>Fit</SectionTitle>
          <FitRow label="Experience" value={score.experienceFit} />
          <FitRow label="Location" value={score.locationFit} />
          <FitRow label="Notice period" value={score.noticePeriodFit} />
        </Stack>

        {score.explanation && (
          <Stack gap={6}>
            <CollapseTrigger
              label={SUMMARY_LABEL}
              isOpen={isSummaryOpen}
              controlsId={SUMMARY_CONTENT_ID}
              onToggle={() => setIsSummaryOpen((open) => !open)}
            />
            {isSummaryOpen && (
              <div id={SUMMARY_CONTENT_ID}>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-2)', lineHeight: 1.55, margin: 0 }}>{score.explanation}</p>
              </div>
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
