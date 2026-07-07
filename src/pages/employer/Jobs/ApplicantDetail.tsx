// FILE: src/pages/employer/Jobs/ApplicantDetail.tsx
// Applicant detail page (D3) — the last screen of the employer pipeline. On mount it
// fetches detail + stages + archive reasons in parallel. Desktop (>900px) is two
// columns: resume viewer left, score/actions/history right; mobile stacks them with
// the resume first (D9). A 404 explains a stale link rather than bouncing. After any
// move/archive/unarchive we refetch the full detail so the timeline stays truthful (C9).

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Container, Card, Button, Alert, PageHeader, Stack, SkeletonCard,
} from '../../../components/ui';
import {
  fetchApplicantDetail, listStages, listArchiveReasons, EmployerApplicantsApiError,
} from '../../../api/employer-applicants-api';
import type { ApplicantDetail, Stage, ArchiveReason } from '../../../types/employer-applicants';
import { useViewport } from '../../../hooks/shared/useViewport';
import ApplicantResumeViewer from './ApplicantResumeViewer';
import ApplicantScoreCard from './ApplicantScoreCard';
import ApplicantActions from './ApplicantActions';
import ApplicantStageHistory from './ApplicantStageHistory';

type LoadState = 'loading' | 'loaded' | 'error' | 'not_found';
const LOAD_ERROR_MESSAGE = 'Could not load this applicant.';

// No magic strings for tab ids (C2/D6). Only pipeline/ranked are returnable; a
// missing/other ?from lands on Settings (no query), the posting page's default.
const TAB_IDS = { SETTINGS: 'settings', PIPELINE: 'pipeline', RANKED: 'ranked' } as const;
const RETURNABLE_TAB_IDS: string[] = [TAB_IDS.PIPELINE, TAB_IDS.RANKED];

export default function ApplicantDetailPage() {
  const { postingId, appId } = useParams<{ postingId: string; appId: string }>();
  const [searchParams] = useSearchParams();
  const { w } = useViewport();
  const twoColumn = w > 900;

  const [detail, setDetail] = useState<ApplicantDetail | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [reasons, setReasons] = useState<ArchiveReason[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);

  const load = useCallback(async () => {
    if (!appId) return;
    setLoadState('loading');
    try {
      const [detailResult, stagesResult, reasonsResult] = await Promise.all([
        fetchApplicantDetail(appId),
        listStages(),
        listArchiveReasons(),
      ]);
      setDetail(detailResult);
      setStages(stagesResult);
      setReasons(reasonsResult);
      setLoadState('loaded');
    } catch (error) {
      if (error instanceof EmployerApplicantsApiError && error.status === 404) {
        setLoadState('not_found');
        return;
      }
      setLastError(error instanceof EmployerApplicantsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [appId]);

  useEffect(() => { void load(); }, [load]);

  // Return the user to the tab they came from (P1.4): ?from=pipeline|ranked → ?tab=…
  const fromTab = searchParams.get('from');
  const backTabQuery = fromTab && RETURNABLE_TAB_IDS.includes(fromTab) ? `?tab=${fromTab}` : '';
  const backHref = postingId ? `/employer/jobs/${postingId}${backTabQuery}` : '/employer/jobs';

  function renderBody() {
    if (loadState === 'loading') return <SkeletonCard lines={6} />;
    if (loadState === 'not_found') {
      return (
        <Card>
          <Stack gap={14}>
            <Alert type="error">Applicant not found. The application may have been removed, or you may not have access to it.</Alert>
            <div><Link to={backHref}><Button variant="secondary">Back to posting</Button></Link></div>
          </Stack>
        </Card>
      );
    }
    if (loadState === 'error' || !detail) {
      return (
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{lastError}</span>
            <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
          </Stack>
        </Alert>
      );
    }

    const viewer = (
      <ApplicantResumeViewer
        applicationId={detail.application.id}
        resumeMeta={detail.resumeMeta}
        initialUrl={detail.resumeDownloadUrl}
      />
    );
    const sidebar = (
      <Stack gap={16}>
        <ApplicantScoreCard score={detail.score} />
        <ApplicantActions
          applicationId={detail.application.id}
          currentStageId={detail.application.stageId}
          archived={Boolean(detail.application.archived)}
          stages={stages}
          reasons={reasons}
          onDone={load}
        />
        <ApplicantStageHistory stageChanges={detail.stageChanges} stages={stages} />
      </Stack>
    );

    if (!twoColumn) {
      return <Stack gap={16}>{viewer}{sidebar}</Stack>;
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)', gap: 20, alignItems: 'start' }}>
        {viewer}
        {sidebar}
      </div>
    );
  }

  const name = detail?.contact?.fullName ?? 'Applicant';
  const email = detail?.contact?.email;

  return (
    <Container size="xl" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <PageHeader
        label="APPLICANT"
        title={name}
        subtitle={email}
        actions={<Link to={backHref}><Button variant="ghost" size="sm">Back to posting</Button></Link>}
      />
      {renderBody()}
    </Container>
  );
}
