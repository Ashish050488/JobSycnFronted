// FILE: src/pages/apply/Company.tsx
// Public mini careers page (/apply/:companySlug). Lists a company's active jobs;
// each links to the apply form. No auth, no seeker/employer context (C9).

import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container, Card, Alert, Button, Stack, SkeletonCard, EmptyState } from '../../components/ui';
import PublicLayout from '../../components/layouts/PublicLayout';
import { fetchPublicCompany, PublicApiError } from '../../api/public-api';
import type { PublicCompany, PublicJobSummary } from '../../types/public-apply';

type LoadState = 'loading' | 'loaded' | 'not_found' | 'error';

export default function ApplyCompany() {
  const { companySlug = '' } = useParams();
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [jobs, setJobs] = useState<PublicJobSummary[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const result = await fetchPublicCompany(companySlug);
      setCompany(result.company);
      setJobs(result.jobs);
      setLoadState('loaded');
    } catch (err) {
      setLoadState(err instanceof PublicApiError && err.status === 404 ? 'not_found' : 'error');
    }
  }, [companySlug]);

  useEffect(() => { void load(); }, [load]);

  return (
    <PublicLayout companyName={company?.name}>
      <Container size="md" style={{ paddingTop: 32, paddingBottom: 60 }}>
        {loadState === 'loading' && <SkeletonCard lines={4} />}

        {loadState === 'not_found' && (
          <Card>
            <Stack gap={12}>
              <Alert type="error">Company not found. The link may be incorrect or the company is no longer listed.</Alert>
              <div><Link to="/"><Button variant="secondary">Go to JobMesh</Button></Link></div>
            </Stack>
          </Card>
        )}

        {loadState === 'error' && (
          <Alert type="error">
            <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
              <span>Could not load this page.</span>
              <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
            </Stack>
          </Alert>
        )}

        {loadState === 'loaded' && company && (
          <Stack gap={20}>
            <div>
              <h1 className="font-display" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.1rem)', fontWeight: 600, color: 'var(--ink)' }}>{company.name}</h1>
              {company.website && (
                <a href={company.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: 'var(--link)' }}>
                  {company.website}
                </a>
              )}
            </div>

            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)' }}>Open positions</h2>

            {jobs.length === 0 ? (
              <EmptyState title="No open positions" description="This company has no open positions at this time." />
            ) : (
              <Stack gap={10}>
                {jobs.map((job) => (
                  <Link key={job.id} to={`/apply/${companySlug}/${job.slug}`} style={{ textDecoration: 'none' }}>
                    <Card hoverable>
                      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>{job.title}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                        {[job.location, job.employmentType].filter(Boolean).join(' · ')}
                      </p>
                    </Card>
                  </Link>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Container>
    </PublicLayout>
  );
}
