// FILE: src/components/shared/ShipsNext.tsx
// Real, reusable placeholder for routes whose page lands in a later step. Shows
// the screen's name plus a way back, so a user who reaches it sees intent rather
// than a blank screen (R4). 4B.2/4B.3 swap the route element; this file stays.

import { Link } from 'react-router-dom';
import { Container, Card, Button, PageHeader, Stack } from '../ui';

export default function ShipsNext({ label }: { label: string }) {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-sunken)', padding: '48px 0' }}>
      <Container size="md">
        <PageHeader label="EMPLOYER" title={label} />
        <Card variant="raised">
          <Stack gap={16}>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
              This screen lands in the next step.
            </p>
            <div>
              <Link to="/employer/jobs">
                <Button variant="secondary">Back to postings</Button>
              </Link>
            </div>
          </Stack>
        </Card>
      </Container>
    </div>
  );
}
