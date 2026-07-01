// FILE: src/pages/apply/Success.tsx
// Post-submit confirmation (/apply/:companySlug/:jobSlug/success). Reads the
// company + job from router location.state (passed by Form); falls back to a
// generic message on direct navigation (R5).

import { Link, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Container, Card, Button, Stack } from '../../components/ui';
import PublicLayout from '../../components/layouts/PublicLayout';

interface SuccessState { companyName?: string; jobTitle?: string }

export default function ApplySuccess() {
  const { companySlug = '' } = useParams();
  const state = (useLocation().state ?? {}) as SuccessState;
  const { companyName, jobTitle } = state;

  return (
    <PublicLayout companyName={companyName}>
      <Container size="sm" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <Card variant="raised">
          <Stack gap={14} align="center">
            <CheckCircle2 size={44} color="var(--success)" aria-hidden />
            <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>
              Application submitted
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--ink)', textAlign: 'center', lineHeight: 1.55 }}>
              {jobTitle && companyName
                ? `You applied to ${jobTitle} at ${companyName}.`
                : 'Your application has been submitted.'}
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              What happens next: the team will review your application. You may hear back within a few days.
            </p>
            <Link to={`/apply/${companySlug}`}>
              <Button variant="secondary">
                {companyName ? `View more positions at ${companyName}` : 'View more positions'}
              </Button>
            </Link>
          </Stack>
        </Card>
      </Container>
    </PublicLayout>
  );
}
