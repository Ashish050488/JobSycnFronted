// FILE: src/pages/employer/Jobs/ApplicantDetail.tsx
// Applicant detail page (D3). Fetches detail + stages + archive reasons in parallel;
// desktop (>900px) is two columns (resume left, scrollable sidebar right), mobile
// stacks them. PP2 adds prev/next over the source-tab list; P3 gives the sidebar its
// own scroll so the page never scrolls on desktop.

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Container, Card, Button, Alert, PageHeader, Stack, SkeletonCard,
} from '../../../components/ui';
import {
  fetchApplicantDetail, listApplicantsForPosting, listStages, listArchiveReasons, EmployerApplicantsApiError,
} from '../../../api/employer-applicants-api';
import type { Applicant, ApplicantDetail, ApplicantSort, Stage, ArchiveReason } from '../../../types/employer-applicants';
import { useViewport } from '../../../hooks/shared/useViewport';
import { useApplicantKeyboardNav } from '../../../hooks/employer/useApplicantKeyboardNav';
import ApplicantResumeViewer from './ApplicantResumeViewer';
import ApplicantScoreCard from './ApplicantScoreCard';
import ApplicantActions from './ApplicantActions';
import ApplicantStageHistory from './ApplicantStageHistory';
import ApplicantStickyHeader from './ApplicantStickyHeader';

type LoadState = 'loading' | 'loaded' | 'error' | 'not_found';
type ListStatus = 'idle' | 'loading' | 'loaded' | 'failed';
const LOAD_ERROR_MESSAGE = 'Could not load this applicant.';

// Prev/next list order mirrors the source tab (PP2/R4): Ranked → score, else date.
const sortForFrom = (from: string | null): ApplicantSort => (from === 'ranked' ? 'score' : 'date');

// No magic strings for tab ids (C2/D6). Only pipeline/ranked are returnable; a
// missing/other ?from lands on Settings (no query), the posting page's default.
const TAB_IDS = { SETTINGS: 'settings', PIPELINE: 'pipeline', RANKED: 'ranked' } as const;
const RETURNABLE_TAB_IDS: string[] = [TAB_IDS.PIPELINE, TAB_IDS.RANKED];

// Back-link copy mirrors the ?from source (P2.1/D4); unknown/missing → generic.
const BACK_LABEL_BY_FROM = { ranked: 'Back to Ranked', pipeline: 'Back to Pipeline' } as const;
const DEFAULT_BACK_LABEL = 'Back to posting';

function resolveBackLabel(from: string | null): string {
  if (from === TAB_IDS.RANKED || from === TAB_IDS.PIPELINE) return BACK_LABEL_BY_FROM[from];
  return DEFAULT_BACK_LABEL;
}
// Desktop sidebar owns its scroll (P3.1): cap it at the viewport minus fixed chrome —
// N1 nav + P2 sticky bar + spacing. Recompute if the nav or sticky-bar height changes.
const NAV_AND_STICKY_OFFSET_PIXELS = 145;

export default function ApplicantDetailPage() {
  const { postingId, appId } = useParams<{ postingId: string; appId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { w } = useViewport();
  const twoColumn = w > 900;

  const [detail, setDetail] = useState<ApplicantDetail | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [reasons, setReasons] = useState<ArchiveReason[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);
  const [listApplicants, setListApplicants] = useState<Applicant[]>([]);
  const [, setListStatus] = useState<ListStatus>('idle');

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
  const backLabel = resolveBackLabel(fromTab);
  // Prev/next (PP2): fetch the source-tab-ordered list; failure degrades silently (D2).
  useEffect(() => {
    if (!postingId) return undefined;
    let isActive = true;
    setListStatus('loading');
    listApplicantsForPosting(postingId, { sort: sortForFrom(fromTab) })
      .then((items) => { if (isActive) { setListApplicants(items); setListStatus('loaded'); } })
      .catch(() => { if (isActive) setListStatus('failed'); });
    return () => { isActive = false; };
  }, [postingId, fromTab]);
  const currentIndex = listApplicants.findIndex((item) => item.application.id === appId);
  const isInList = currentIndex >= 0;
  const buildDetailHref = (targetId: string) => `/employer/jobs/${postingId}/applicants/${targetId}${fromTab ? `?from=${fromTab}` : ''}`;
  const previousHref = isInList && currentIndex > 0 ? buildDetailHref(listApplicants[currentIndex - 1].application.id) : null;
  const nextHref = isInList && currentIndex < listApplicants.length - 1 ? buildDetailHref(listApplicants[currentIndex + 1].application.id) : null;
  const positionText = isInList ? `${currentIndex + 1} of ${listApplicants.length}` : '';
  useApplicantKeyboardNav({
    onPrev: previousHref ? () => navigate(previousHref) : null,
    onNext: nextHref ? () => navigate(nextHref) : null,
    onEscape: () => navigate(backHref),
  });

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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.9fr) minmax(340px, 1fr)', gap: 20, alignItems: 'start' }}>
        {viewer}
        <div style={{ maxHeight: `calc(100vh - ${NAV_AND_STICKY_OFFSET_PIXELS}px)`, overflowY: 'auto', paddingRight: 8 }}>
          {sidebar}
        </div>
      </div>
    );
  }

  const name = detail?.contact?.fullName ?? 'Applicant';
  const email = detail?.contact?.email;

  // Desktop pins a sticky bar with the back-CTA + identity (P2.1/P2.4); mobile keeps
  // the PageHeader as its single header.
  return (
    <Container size="xl" style={{ paddingTop: twoColumn ? 0 : 32, paddingBottom: 60 }}>
      {twoColumn ? (
        <ApplicantStickyHeader
          backHref={backHref}
          backLabel={backLabel}
          candidateName={name}
          candidateEmail={email ?? null}
          previousHref={previousHref}
          nextHref={nextHref}
          positionText={positionText}
        />
      ) : (
        <PageHeader
          label="APPLICANT"
          title={name}
          subtitle={email}
          actions={<Link to={backHref}><Button variant="ghost" size="sm">{backLabel}</Button></Link>}
        />
      )}
      {renderBody()}
    </Container>
  );
}
