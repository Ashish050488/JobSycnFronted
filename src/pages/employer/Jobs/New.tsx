// FILE: src/pages/employer/Jobs/New.tsx
// Create-posting page. Wraps PostingForm with the create submit handler. On
// success it toasts the new posting's title and returns to the list (4B.1),
// which refetches on mount so the new posting appears. Errors are surfaced by
// PostingForm itself — this handler intentionally lets them throw.

import { useNavigate } from 'react-router-dom';
import { Container, Card, PageHeader, useToast } from '../../../components/ui';
import PostingForm from './PostingForm';
import { createEmployerPosting } from '../../../api/employer-jobs-api';
import type { PostingCreateInput } from '../../../types/employer-jobs';

export default function EmployerJobsNew() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleCreate = async (input: PostingCreateInput) => {
    const posting = await createEmployerPosting(input);
    showToast('success', `Posting created: ${posting.title}`);
    navigate(`/employer/jobs/${posting.id}`);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-sunken)', padding: '48px 0' }}>
      <Container size="md">
        <PageHeader label="EMPLOYER" title="New posting" />
        <Card variant="raised">
          <PostingForm
            submitLabel="Create posting"
            onSubmit={handleCreate}
            onCancel={() => navigate('/employer/jobs')}
          />
        </Card>
      </Container>
    </div>
  );
}
