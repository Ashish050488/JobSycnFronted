// FILE: src/pages/employer/Jobs/ApplicantDetail.tsx
// Applicant detail page. Desktop (>900px) is two full-width columns (resume left, 3-card
// sidebar right, P8), mobile stacks them. PP2 adds prev/next over the source-tab list.

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Container, Card, Button, Alert, PageHeader, Stack, SkeletonCard } from '../../../components/ui';
import { fetchApplicantDetail, listApplicantsForPosting, listStages, listArchiveReasons, EmployerApplicantsApiError } from '../../../api/employer-applicants-api';
import type { Applicant, ApplicantDetail, ApplicantSort, Stage, ArchiveReason } from '../../../types/employer-applicants';
import { useViewport } from '../../../hooks/shared/useViewport';
import { useApplicantKeyboardNav } from '../../../hooks/employer/useApplicantKeyboardNav';
import ApplicantResumeViewer from './ApplicantResumeViewer';
import ApplicantReviewPanel from './ApplicantReviewPanel';
import ApplicantCoverNote from './ApplicantCoverNote';
import ApplicantStickyHeader from './ApplicantStickyHeader';

type LoadState = 'loading' | 'loaded' | 'error' | 'not_found';
type ListStatus = 'idle' | 'loading' | 'loaded' | 'failed';
const LOAD_ERROR_MESSAGE = 'Could not load this applicant.';

// Prev/next list order mirrors the source tab (PP2/R4): Ranked → score, else date.
const sortForFrom = (from: string | null): ApplicantSort => (from === 'ranked' ? 'score' : 'date');

// No magic strings for tab ids (C2/D6). Only pipeline/ranked are returnable.
const TAB_IDS = { SETTINGS: 'settings', PIPELINE: 'pipeline', RANKED: 'ranked' } as const;
const RETURNABLE_TAB_IDS: string[] = [TAB_IDS.PIPELINE, TAB_IDS.RANKED];
// Back-link copy mirrors the ?from source (P2.1/D4); unknown/missing → generic.
const BACK_LABEL_BY_FROM = { ranked: 'Back to Ranked', pipeline: 'Back to Pipeline' } as const;
const DEFAULT_BACK_LABEL = 'Back to posting';

function resolveBackLabel(from: string | null): string {
  if (from === TAB_IDS.RANKED || from === TAB_IDS.PIPELINE) return BACK_LABEL_BY_FROM[from];
  return DEFAULT_BACK_LABEL;
}
// No-page-scroll (P8/D2/D3): wrapper pinned to viewport minus N1 nav; overflow:hidden clips so
// the document never scrolls. Grid children own their height and scroll internally.
const NAV_HEIGHT_PIXELS = 65;
const PAGE_HORIZONTAL_PADDING_PIXELS = 24;
const WRAPPER_STYLE: CSSProperties = {
  width: '100%', height: `calc(100vh - ${NAV_HEIGHT_PIXELS}px)`, overflow: 'hidden',
  paddingLeft: PAGE_HORIZONTAL_PADDING_PIXELS, paddingRight: PAGE_HORIZONTAL_PADDING_PIXELS,
  boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
};
const GRID_STYLE: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
  gap: 20, alignItems: 'stretch', flex: 1, minHeight: 0,
};
const LEFT_COLUMN_STYLE: CSSProperties = { height: '100%', overflow: 'hidden', minHeight: 0 };
const RIGHT_COLUMN_STYLE: CSSProperties = { height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingRight: 6, minHeight: 0 };

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

    const viewer = <ApplicantResumeViewer applicationId={detail.application.id} resumeMeta={detail.resumeMeta} initialUrl={detail.resumeDownloadUrl} />;
    const sidebar = (
      <ApplicantReviewPanel
        score={detail.score}
        applicationId={detail.application.id}
        currentStageId={detail.application.stageId}
        archived={Boolean(detail.application.archived)}
        stages={stages}
        reasons={reasons}
        stageChanges={detail.stageChanges}
        onDone={load}
      />
    );
    // Candidate-voiced note (R1/R2): shown above the review panel, only when non-empty (R3).
    const coverNote = detail.application.coverNote?.trim() || null;
    const coverNoteCard = coverNote ? <ApplicantCoverNote coverNote={coverNote} /> : null;

    if (!twoColumn) {
      return <Stack gap={16}>{viewer}{coverNoteCard}{sidebar}</Stack>;
    }
    return (
      <div style={GRID_STYLE}>
        <div style={LEFT_COLUMN_STYLE}>{viewer}</div>
        <div style={RIGHT_COLUMN_STYLE}>{coverNoteCard}{sidebar}</div>
      </div>
    );
  }

  const name = detail?.contact?.fullName ?? 'Applicant';
  const email = detail?.contact?.email;

  // Desktop pins a sticky bar with the back-CTA + identity (P2.1/P2.4); mobile keeps PageHeader.
  const header = twoColumn ? (
    <ApplicantStickyHeader
      backHref={backHref} backLabel={backLabel} candidateName={name} candidateEmail={email ?? null}
      previousHref={previousHref} nextHref={nextHref} positionText={positionText}
    />
  ) : (
    <PageHeader
      label="APPLICANT" title={name} subtitle={email}
      actions={<Link to={backHref}><Button variant="ghost" size="sm">{backLabel}</Button></Link>}
    />
  );

  // Desktop: full-width fixed-viewport wrapper (P8); mobile keeps the centred Container.
  if (twoColumn) {
    return (
      <div style={WRAPPER_STYLE}>
        {header}
        {renderBody()}
      </div>
    );
  }
  return (
    <Container size="xl" style={{ paddingTop: 32, paddingBottom: 60 }}>
      {header}
      {renderBody()}
    </Container>
  );
}
