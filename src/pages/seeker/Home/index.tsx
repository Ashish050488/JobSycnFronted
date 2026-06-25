// FILE: src/pages/seeker/Home/index.tsx
// Guest landing page. Composes Hero + CompaniesCarousel + JobsList.

import { useEffect, useState } from 'react';
import type { IJob, ICompany } from '../../../types';
import { BRAND } from '../../../theme/brand';
import Hero from './Hero';
import CompaniesCarousel from './CompaniesCarousel';
import JobsList from './JobsList';

export default function Home() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = `${BRAND.appName} — ${BRAND.tagline}`; }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/seeker/jobs?limit=8').then(r => r.ok ? r.json() : { jobs: [] }),
      fetch('/api/seeker/jobs/directory').then(r => r.ok ? r.json() : []),
    ]).then(([j, c]) => {
      if (cancelled) return;
      setJobs((j?.jobs || j || []).slice(0, 8));
      setCompanies((Array.isArray(c) ? c : []).slice(0, 10));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Hero />
      <CompaniesCarousel companies={companies} loading={loading} />
      <JobsList jobs={jobs} loading={loading} />
    </>
  );
}
