// FILE: src/pages/apply/Form.tsx
// Public apply form (/apply/:companySlug/:jobSlug). Fetches the job, renders the
// field block (ApplyFormFields), validates client-side (mirroring the backend),
// submits multipart FormData, and routes to the success page. No auth/contexts (C9).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Button, Alert, Stack, SkeletonCard } from '../../components/ui';
import PublicLayout from '../../components/layouts/PublicLayout';
import ApplyFormFields from './ApplyFormFields';
import { fetchPublicJob, submitApplication, PublicApiError } from '../../api/public-api';
import { validateApplyForm, fieldError, mapServerError } from './apply-form-helpers';
import type { ApplyErrors } from './apply-form-helpers';
import type { ApplyFormData, PublicCompany, PublicJob } from '../../types/public-apply';

type LoadState = 'loading' | 'loaded' | 'not_found' | 'error';
const EMPTY: ApplyFormData = {
  firstName: '', lastName: '', email: '', phone: '', coverNote: '',
  consent_dpdp: false, consent_futureOpportunities: false, resume: null, honeypot: '',
};

export default function ApplyForm() {
  const { companySlug = '', jobSlug = '' } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<PublicCompany | null>(null);
  const [job, setJob] = useState<PublicJob | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [data, setData] = useState<ApplyFormData>(EMPTY);
  const [errors, setErrors] = useState<ApplyErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchPublicJob(companySlug, jobSlug);
        if (cancelled) return;
        setCompany(result.company); setJob(result.job); setLoadState('loaded');
      } catch (err) {
        if (cancelled) return;
        setLoadState(err instanceof PublicApiError && err.status === 404 ? 'not_found' : 'error');
      }
    })();
    return () => { cancelled = true; };
  }, [companySlug, jobSlug]);

  const set = useCallback(<K extends keyof ApplyFormData>(field: K, value: ApplyFormData[K]) => {
    setData((d) => ({ ...d, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined, _form: undefined }));
  }, []);
  const onBlur = useCallback((field: keyof ApplyFormData) => {
    setData((d) => { setErrors((e) => ({ ...e, [field]: fieldError(field, d) })); return d; });
  }, []);

  const canSubmit = useMemo(() => (
    data.firstName.trim() !== '' && data.lastName.trim() !== '' && data.email.trim() !== ''
    && data.resume !== null && data.consent_dpdp && !submitting
  ), [data, submitting]);

  const handleSubmit = async () => {
    const validation = validateApplyForm(data);
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    setSubmitting(true);
    setErrors({});
    try {
      const form = new FormData();
      form.append('firstName', data.firstName.trim());
      form.append('lastName', data.lastName.trim());
      form.append('email', data.email.trim());
      form.append('phone', data.phone.trim());
      form.append('coverNote', data.coverNote.trim());
      form.append('consent_dpdp', String(data.consent_dpdp));
      form.append('consent_futureOpportunities', String(data.consent_futureOpportunities));
      form.append('website_url', data.honeypot);
      if (data.resume) form.append('resume', data.resume);
      await submitApplication(companySlug, jobSlug, form);
      navigate(`/apply/${companySlug}/${jobSlug}/success`, {
        replace: true, state: { companyName: company?.name, jobTitle: job?.title },
      });
    } catch (err) {
      setErrors(err instanceof PublicApiError
        ? mapServerError(err.code, err.message)
        : { _form: 'Could not submit your application. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout companyName={company?.name}>
      <Container size="sm" style={{ paddingTop: 24, paddingBottom: 60 }}>
        {loadState === 'loading' && <SkeletonCard lines={4} />}
        {loadState === 'not_found' && (
          <Card>
            <Stack gap={12}>
              <Alert type="error">This position is no longer accepting applications.</Alert>
              <div><Link to={`/apply/${companySlug}`}><Button variant="secondary">View open positions</Button></Link></div>
            </Stack>
          </Card>
        )}
        {loadState === 'error' && <Alert type="error">Could not load this position. Please try again.</Alert>}

        {loadState === 'loaded' && job && company && (
          <Stack gap={20}>
            <div>
              <h1 className="font-display" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 600, color: 'var(--ink)' }}>{job.title}</h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', marginTop: 4 }}>
                {[company.name, job.location, job.employmentType].filter(Boolean).join(' · ')}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink)', marginTop: 12, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{job.description}</p>
            </div>
            <Card>
              <Stack gap={16}>
                {errors._form && <Alert type="error">{errors._form}</Alert>}
                <ApplyFormFields data={data} errors={errors} companyName={company.name} set={set} onBlur={onBlur} />
                <Button loading={submitting} disabled={!canSubmit} onClick={handleSubmit}>Submit application</Button>
              </Stack>
            </Card>
          </Stack>
        )}
      </Container>
    </PublicLayout>
  );
}
