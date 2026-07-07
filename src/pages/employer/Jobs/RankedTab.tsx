// FILE: src/pages/employer/Jobs/RankedTab.tsx
// Ranked applicant table for a posting. Fetches applicants (sorted server-side by
// score or date) + stages in parallel on mount and whenever the sort changes.
// Score renders as a tier-coloured Badge; a null score shows a muted "Not scored".
// Each row links to the applicant detail route (lands in Step 7C).

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Card, Badge, Button, Alert, Stack, Select, EmptyState, SkeletonCard,
} from '../../../components/ui';
import { Table } from '../../../components/ui';
import type { Column } from '../../../components/ui';
import { listApplicantsForPosting, listStages, EmployerApplicantsApiError } from '../../../api/employer-applicants-api';
import type { Applicant, Stage, ApplicantSort } from '../../../types/employer-applicants';
import { tierBadgeVariant, formatRelativeTime } from './applicant-view-helpers';
import {
  formatRankedScoreLabel, isScoringInProgress, SCORING_STATE_LABEL,
} from './pipeline-tab-helpers';

type LoadState = 'loading' | 'loaded' | 'error';
const LOAD_ERROR_MESSAGE = 'Could not load applicants.';

const SORT_OPTIONS = [
  { value: 'score', label: 'Score: high to low' },
  { value: 'date', label: 'Applied: newest first' },
];

function ScoreCell({ applicant }: { applicant: Applicant }) {
  if (!applicant.score || applicant.score.processingError) {
    const label = isScoringInProgress(applicant.application.appliedAt)
      ? SCORING_STATE_LABEL.IN_PROGRESS : SCORING_STATE_LABEL.NOT_SCORED;
    return <span style={{ color: 'var(--ink-muted)', fontSize: '0.8125rem' }}>{label}</span>;
  }
  const { score, tier } = applicant.score;
  return <Badge variant={tierBadgeVariant(tier)}>{formatRankedScoreLabel(score, tier)}</Badge>;
}

export default function RankedTab({ postingId }: { postingId: string }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [sort, setSort] = useState<ApplicantSort>('score');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);

  const load = useCallback(async (activeSort: ApplicantSort) => {
    setLoadState('loading');
    try {
      const [applicantsResult, stagesResult] = await Promise.all([
        listApplicantsForPosting(postingId, { sort: activeSort }),
        listStages(),
      ]);
      setApplicants(applicantsResult);
      setStages(stagesResult);
      setLoadState('loaded');
    } catch (error) {
      setLastError(error instanceof EmployerApplicantsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [postingId]);

  useEffect(() => { void load(sort); }, [load, sort]);

  const stageNameById = new Map(stages.map((stage) => [stage.id, stage.text]));

  const columns: Column<Applicant>[] = [
    {
      key: 'applicant',
      header: 'Applicant',
      render: (applicant) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{applicant.contact?.fullName ?? '—'}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{applicant.contact?.email ?? ''}</div>
        </div>
      ),
    },
    { key: 'score', header: 'Score', render: (applicant) => <ScoreCell applicant={applicant} /> },
    {
      key: 'stage',
      header: 'Stage',
      render: (applicant) => stageNameById.get(applicant.application.stageId) ?? '—',
    },
    {
      key: 'applied',
      header: 'Applied',
      render: (applicant) => formatRelativeTime(applicant.application.appliedAt),
    },
    {
      key: 'actions',
      header: '',
      render: (applicant) => (
        <Link to={`/employer/jobs/${postingId}/applicants/${applicant.application.id}?from=ranked`}>
          <Button variant="ghost" size="sm">View</Button>
        </Link>
      ),
    },
  ];

  if (loadState === 'loading') return <SkeletonCard lines={5} />;
  if (loadState === 'error') {
    return (
      <Alert type="error">
        <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
          <span>{lastError}</span>
          <Button variant="ghost" size="sm" onClick={() => void load(sort)}>Retry</Button>
        </Stack>
      </Alert>
    );
  }
  if (applicants.length === 0) {
    return (
      <EmptyState
        title="No applications yet"
        description="Share your apply URL to start receiving applications."
      />
    );
  }

  return (
    <Stack gap={12}>
      <div style={{ maxWidth: 240 }}>
        <Select
          aria-label="Sort applicants"
          value={sort}
          options={SORT_OPTIONS}
          onChange={(event) => setSort(event.target.value as ApplicantSort)}
        />
      </div>
      <Card padding="sm">
        <Table columns={columns} data={applicants} />
      </Card>
    </Stack>
  );
}
