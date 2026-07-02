// FILE: src/pages/employer/Jobs/Detail.tsx
// Posting detail page. Fetches the posting by :postingId on mount and renders the
// Settings tab (view/edit/close/reopen) plus placeholder tabs for Pipeline /
// Ranked / Stats (they land in later steps). Loading / error / not-found states
// are distinct; not-found does NOT auto-redirect (R5) so a stale bookmark is
// explained rather than silently bounced.

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Container, Card, Button, Alert, PageHeader, Stack, Tabs, SkeletonCard,
} from '../../../components/ui';
import type { TabItem } from '../../../components/ui';
import DetailSettings from './DetailSettings';
import PipelineTab from './PipelineTab';
import RankedTab from './RankedTab';
import { getEmployerPosting, EmployerJobsApiError } from '../../../api/employer-jobs-api';
import type { Posting } from '../../../types/employer-jobs';

type LoadState = 'loading' | 'loaded' | 'error' | 'not_found';
const LOAD_ERROR_MESSAGE = 'Could not load this posting.';

function PlaceholderTab({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>{children}</p>
    </Card>
  );
}

export default function EmployerJobsDetail() {
  const { postingId } = useParams<{ postingId: string }>();
  const [posting, setPosting] = useState<Posting | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);

  const loadPosting = useCallback(async () => {
    if (!postingId) return;
    setLoadState('loading');
    try {
      const result = await getEmployerPosting(postingId);
      setPosting(result);
      setLoadState('loaded');
    } catch (error) {
      if (error instanceof EmployerJobsApiError && error.status === 404) {
        setLoadState('not_found');
        return;
      }
      setLastError(error instanceof EmployerJobsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [postingId]);

  useEffect(() => { void loadPosting(); }, [loadPosting]);

  function renderBody() {
    if (loadState === 'loading') return <SkeletonCard lines={4} />;
    if (loadState === 'not_found') {
      return (
        <Card>
          <Stack gap={14}>
            <Alert type="error">
              Posting not found. It may have been deleted, or you may not have access to it.
            </Alert>
            <div>
              <Link to="/employer/jobs"><Button variant="secondary">Back to postings</Button></Link>
            </div>
          </Stack>
        </Card>
      );
    }
    if (loadState === 'error' || !posting) {
      return (
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{lastError}</span>
            <Button variant="ghost" size="sm" onClick={() => void loadPosting()}>Retry</Button>
          </Stack>
        </Alert>
      );
    }

    const tabs: TabItem[] = [
      { id: 'settings', label: 'Settings', content: <DetailSettings posting={posting} onReload={loadPosting} /> },
      { id: 'pipeline', label: 'Pipeline', content: <PipelineTab postingId={posting.id} /> },
      { id: 'ranked', label: 'Ranked', content: <RankedTab postingId={posting.id} /> },
      { id: 'stats', label: 'Stats', content: <PlaceholderTab>Ships in Step 8 — the posting funnel stats live here.</PlaceholderTab> },
    ];
    return <Tabs tabs={tabs} defaultTabId="settings" />;
  }

  return (
    <Container size="lg" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <PageHeader label="EMPLOYER" title={posting?.title ?? 'Posting'} />
      {renderBody()}
    </Container>
  );
}
