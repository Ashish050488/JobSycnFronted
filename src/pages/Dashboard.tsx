// FILE: src/pages/Dashboard.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, X, SlidersHorizontal, MapPin, Building2, Clock, ExternalLink, Loader2 } from 'lucide-react';
import type { IJob } from '../types';
import { Container, PageHeader, Button, Badge, EmptyState } from '../components/ui';
import { COPY } from '../theme/brand';

const PAGE_SIZE = 30;

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return mobile;
}

interface CS { companyName: string; openRoles: number; }
export default function Dashboard() {
  const [sp, setSp] = useSearchParams();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [cos, setCos] = useState<CS[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [workplaceFilter, setWorkplaceFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const isMobile = useIsMobile();
  useEffect(() => { document.title = COPY.site.documentTitleJobs; }, []);
  const sel = sp.get('company') || '';

  const fetchJobs = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      if (sel) params.set('company', sel);
      const jr = await fetch(`/api/jobs?${params}`);
      const jd = await jr.json() as { jobs?: IJob[]; totalJobs?: number; totalPages?: number };
      const newJobs = jd.jobs ?? [];
      setTotalJobs(jd.totalJobs ?? 0);
      setHasMore(pageNum < (jd.totalPages ?? 1));
      setJobs(prev => append ? [...prev, ...newJobs] : newJobs);
      if (!append && newJobs.length > 0) setSelectedJob(newJobs[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [sel]);

  // Initial load + directory
  useEffect(() => {
    setPage(1); setHasMore(true); setJobs([]);
    (async () => {
      const dr = await fetch('/api/jobs/directory'); const dd: unknown = await dr.json();
      setCos(Array.isArray(dd) ? (dd as CS[]).filter(c => c.openRoles > 0) : []);
    })();
    fetchJobs(1, false);
  }, [sel, fetchJobs]);

  // Load more when page increments
  useEffect(() => {
    if (page > 1) fetchJobs(page, true);
  }, [page, fetchJobs]);

  // Intersection observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        setPage(p => p + 1);
      }
    }, { threshold: 0.1 });
    observerRef.current.observe(node);
  }, [hasMore, loadingMore, loading]);

  const inferPlatform = (job: IJob): string => {
    if (job.ATSPlatform) return job.ATSPlatform;
    const url = (job.ApplicationURL ?? '').toLowerCase();
    if (url.includes('lever.co') || url.includes('jobs.lever.co')) return 'lever';
    if (url.includes('greenhouse.io') || url.includes('boards.greenhouse.io')) return 'greenhouse';
    if (url.includes('ashbyhq.com') || url.includes('jobs.ashby.com')) return 'ashby';
    return '';
  };

  const inferRemote = (job: IJob): boolean => {
    if (job.IsRemote) return true;
    const wt = (job.WorkplaceType ?? '').toLowerCase();
    if (wt === 'remote') return true;
    const loc = (job.Location ?? '').toLowerCase();
    return loc.includes('remote');
  };

  const inferWorkplace = (job: IJob): string => {
    const wt = (job.WorkplaceType ?? '').toLowerCase();
    if (wt === 'remote' || inferRemote(job)) return 'remote';
    if (wt === 'hybrid') return 'hybrid';
    if (wt === 'on-site' || wt === 'onsite') return 'on-site';
    return '';
  };

  const DATE_THRESHOLDS: Record<string, number> = { '1d': 1, '3d': 3, '7d': 7 };

  const visibleJobs = jobs.filter(job => {
    if (workplaceFilter) {
      const wp = inferWorkplace(job);
      if (workplaceFilter === 'remote' && wp !== 'remote') return false;
      if (workplaceFilter === 'hybrid' && wp !== 'hybrid') return false;
      if (workplaceFilter === 'on-site' && wp !== 'on-site') return false;
    }
    if (platformFilter && inferPlatform(job) !== platformFilter) return false;
    if (dateFilter) {
      const threshold = DATE_THRESHOLDS[dateFilter];
      if (threshold) {
        const d = job.PostedDate || job.scrapedAt;
        if (!d) return false;
        const posted = new Date(d);
        if (isNaN(posted.getTime())) return false;
        if (Date.now() - posted.getTime() > threshold * 86400000) return false;
      }
    }
    return true;
  });

  // Auto-select first job when filters change
  useEffect(() => {
    setSelectedJob(visibleJobs.length > 0 ? visibleJobs[0] : null);
  }, [workplaceFilter, platformFilter, dateFilter, sel, loading]);

  const clearAllFilters = () => { setSp({}); setWorkplaceFilter(null); setPlatformFilter(null); setDateFilter(null); };

  const relTime = (d: string | null) => {
    if (!d) return null;
    const posted = new Date(d);
    if (isNaN(posted.getTime())) return null;
    const diff = Math.floor((Date.now() - posted.getTime()) / 86400000);
    if (diff <= 0) return 'Today';
    if (diff === 1) return '1d ago';
    if (diff < 7) return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return `${Math.floor(diff / 30)}mo ago`;
  };

  const logoDomain = (url: string) => { try { return new URL(url).hostname.replace('www.', ''); } catch { return 'example.com'; } };

  const workplaceBadge = (job: IJob): { label: string; bg: string; color: string } | null => {
    const wp = inferWorkplace(job);
    if (wp === 'remote') return { label: '🌐 Remote', bg: '#d1fae5', color: '#065f46' };
    if (wp === 'hybrid') return { label: '⚡ Hybrid', bg: '#fef3c7', color: '#92400e' };
    if (wp === 'on-site') return { label: '🏢 On-site', bg: '#dbeafe', color: '#1e40af' };
    return null;
  };

  const salaryDisplay = (job: IJob): string | null => {
    if (job.SalaryInfo) return job.SalaryInfo;
    if (job.SalaryMin && job.SalaryMax) {
      const fmt = (n: number) => (job.SalaryCurrency === 'INR' || !job.SalaryCurrency) && n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}K`;
      const curr = job.SalaryCurrency === 'INR' ? '₹' : job.SalaryCurrency === 'USD' ? '$' : (job.SalaryCurrency ? job.SalaryCurrency + ' ' : '');
      return `${curr}${fmt(job.SalaryMin)} – ${curr}${fmt(job.SalaryMax)}`;
    }
    return null;
  };

  const platformLabel: Record<string, string> = { lever: 'Lever', greenhouse: 'Greenhouse', ashby: 'Ashby' };

  const LogoImg = ({ job, size }: { job: IJob; size: number }) => {
    const [err, setErr] = useState(false);
    return err ? (
      <span style={{ fontFamily: "'Playfair Display',serif", fontSize: size * 0.55, color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        {job.Company.charAt(0)}
      </span>
    ) : (
      <img src={`https://logo.clearbit.com/${logoDomain(job.ApplicationURL)}`} alt={job.Company} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={() => setErr(true)} />
    );
  };

  const SideBtn = ({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: active ? 'var(--primary-soft)' : 'transparent', color: active ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: active ? 700 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.22s', fontFamily: 'inherit' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{label}</span>
      {count !== undefined && <span style={{ fontSize: '0.75rem', background: 'var(--paper2)', color: 'var(--subtle-ink)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{count}</span>}
    </button>
  );

  /* ── Left-panel compact job card ── */
  const JobListItem = ({ job }: { job: IJob }) => {
    const isSelected = selectedJob?._id === job._id;
    const effectiveDate = job.PostedDate || job.scrapedAt || null;
    const rt = relTime(effectiveDate);
    return (
      <div
        onClick={() => isMobile ? window.open(job.DirectApplyURL || job.ApplicationURL, '_blank', 'noopener,noreferrer') : setSelectedJob(job)}
        style={{
          padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
          background: isSelected ? 'var(--primary-soft)' : 'transparent',
          borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
          transition: 'all 0.18s',
        }}
        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--paper2)'; }}
        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        {/* Row 1: logo + title */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, flexShrink: 0, background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 4 }}>
            <LogoImg job={job} size={32} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{job.JobTitle}</div>
            {/* Row 2: company · location */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, fontSize: '0.78rem', color: 'var(--muted-ink)' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.Company}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.Location}</span>
            </div>
          </div>
        </div>
        {/* Row 3: badges */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {rt && <Badge variant="acid" style={{ fontSize: '0.62rem' }}><Clock size={8} />{rt}</Badge>}
          {job.ContractType && job.ContractType !== 'N/A' && <Badge variant="neutral" style={{ fontSize: '0.62rem' }}>{job.ContractType}</Badge>}
          {(() => { const wb = workplaceBadge(job); return wb ? (
            <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999, background: wb.bg, color: wb.color, fontWeight: 600 }}>{wb.label}</span>
          ) : null; })()}
          {(() => { const sal = salaryDisplay(job); return sal ? (
            <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999, background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>💰 {sal}</span>
          ) : null; })()}
        </div>
      </div>
    );
  };

  /* ── Right-panel detail view ── */
  const DetailPanel = ({ job }: { job: IJob }) => {
    const effectiveDate = job.PostedDate || job.scrapedAt || null;
    const wb = workplaceBadge(job);
    const sal = salaryDisplay(job);
    return (
      <div>
        {/* Header row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 48, height: 48, flexShrink: 0, background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 6 }}>
            <LogoImg job={job} size={48} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.02em' }}>{job.JobTitle}</h2>
              {job.ATSPlatform && (
                <span style={{ background: 'var(--paper2)', padding: '2px 8px', borderRadius: 6, fontSize: 11, color: 'var(--muted-ink)', flexShrink: 0, marginLeft: 8 }}>
                  {platformLabel[job.ATSPlatform] ?? job.ATSPlatform}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}><Building2 size={13} />{job.Company}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}><MapPin size={13} />{job.Location}</span>
              {job.ContractType && job.ContractType !== 'N/A' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}>💼 {job.ContractType}</span>
              )}
              {job.Department && job.Department !== 'N/A' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}>🏢 {job.Department}</span>
              )}
            </div>
          </div>
        </div>

        {/* Badge row */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {wb && <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: wb.bg, color: wb.color, fontWeight: 600 }}>{wb.label}</span>}
          {sal && <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>💰 {sal}</span>}
          {job.Office && <Badge variant="neutral">🏛️ {job.Office}</Badge>}
          {job.Team && job.Team !== job.Department && <Badge variant="neutral">👥 {job.Team}</Badge>}
        </div>

        {/* AllLocations */}
        {Array.isArray(job.AllLocations) && job.AllLocations.length > 1 && (
          <div style={{ fontSize: 12, color: 'var(--muted-ink)', marginTop: 8 }}>
            📍 Also: {job.AllLocations.join(' • ')}
          </div>
        )}

        {/* Timestamps */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.78rem', color: 'var(--muted-ink)' }}>
          <span><Clock size={12} style={{ verticalAlign: -2, marginRight: 4 }} />{effectiveDate ? `${COPY.jobs.postedPrefix} ${new Date(effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : COPY.jobs.postedNA}</span>
          {job.scrapedAt && <span>Scraped: {relTime(job.scrapedAt) ?? 'N/A'}</span>}
        </div>

        {/* Tags */}
        {Array.isArray(job.Tags) && job.Tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {job.Tags.map(tag => (
              <span key={tag} style={{ background: 'var(--paper2)', borderRadius: 999, padding: '2px 10px', fontSize: 12, color: 'var(--muted-ink)' }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Apply buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <a href={job.DirectApplyURL || job.ApplicationURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1 }}>
            <Button size="lg" style={{ width: '100%' }}>{COPY.jobs.applyNow} <ExternalLink size={14} /></Button>
          </a>
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

        {/* Description */}
        <p className="font-sketch" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>About this role</p>
        <div
          className="job-description-html"
          style={{ fontSize: '0.92rem', lineHeight: 1.85, color: 'var(--muted-ink)', overflowY: 'auto', maxHeight: '55vh', padding: '12px 0' }}
          dangerouslySetInnerHTML={{ __html: job.Description ?? 'No description provided.' }}
        />

        {/* DescriptionLists (Lever structured sections) */}
        {Array.isArray(job.DescriptionLists) && job.DescriptionLists.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {job.DescriptionLists.map((section, i) => (
              <div key={i} style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{section.text}</h4>
                <div className="job-description-html" style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--muted-ink)' }} dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            ))}
          </div>
        )}

        {/* Additional Info */}
        {job.AdditionalInfo && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Additional Information</h4>
            <div className="job-description-html" style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--muted-ink)' }} dangerouslySetInnerHTML={{ __html: job.AdditionalInfo }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '16px 0' }}>
        <Container>
          <PageHeader label={COPY.jobs.pageLabel} title={sel || COPY.jobs.pageTitle}
            subtitle={`${totalJobs} ${COPY.jobs.rolesAvailable}`}
            actions={sel ? <button onClick={clearAllFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1.25px solid var(--border)', background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>{sel}<X size={11} /></button> : undefined} />
        </Container>
      </div>
      <Container style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <aside style={{ width: 210, flexShrink: 0, position: 'sticky', top: 76 }} className="hidden md:block">
            {/* Workplace filter */}
            <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12 }}>🌐</span>
                <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>Workplace</span>
              </div>
              <div style={{ padding: 8 }}>
                {([{ label: 'All', value: null }, { label: '🌐 Remote', value: 'remote' }, { label: '⚡ Hybrid', value: 'hybrid' }, { label: '🏢 On-site', value: 'on-site' }] as const).map(opt => (
                  <button key={opt.label} onClick={() => setWorkplaceFilter(opt.value)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: workplaceFilter === opt.value ? 'var(--primary-soft)' : 'transparent', color: workplaceFilter === opt.value ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: workplaceFilter === opt.value ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { if (workplaceFilter !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
                    onMouseLeave={e => { if (workplaceFilter !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Date filter */}
            <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={12} color="var(--primary)" />
                <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>Date Posted</span>
              </div>
              <div style={{ padding: 8 }}>
                {([{ label: 'All time', value: null }, { label: 'Past 24 hours', value: '1d' }, { label: 'Past 3 days', value: '3d' }, { label: 'Past 7 days', value: '7d' }] as const).map(opt => (
                  <button key={opt.label} onClick={() => setDateFilter(opt.value)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: dateFilter === opt.value ? 'var(--primary-soft)' : 'transparent', color: dateFilter === opt.value ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: dateFilter === opt.value ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { if (dateFilter !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
                    onMouseLeave={e => { if (dateFilter !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Platform filter */}
            <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12 }}>🔧</span>
                <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>Job Board</span>
              </div>
              <div style={{ padding: 8 }}>
                {([{ label: 'All', value: null }, { label: 'Lever', value: 'lever' }, { label: 'Greenhouse', value: 'greenhouse' }, { label: 'Ashby', value: 'ashby' }] as const).map(opt => (
                  <button key={opt.label} onClick={() => setPlatformFilter(opt.value)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: platformFilter === opt.value ? 'var(--primary-soft)' : 'transparent', color: platformFilter === opt.value ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: platformFilter === opt.value ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}
                    onMouseEnter={e => { if (platformFilter !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
                    onMouseLeave={e => { if (platformFilter !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={12} color="var(--primary)" />
                <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{COPY.jobs.companiesLabel}</span>
              </div>
              <div className="thin-scroll" style={{ maxHeight: '72vh', overflowY: 'auto', padding: 8 }}>
                <SideBtn label={COPY.jobs.allJobs} active={!sel} onClick={() => setSp({})} />
                {cos.map(c => <SideBtn key={c.companyName} label={c.companyName} count={c.openRoles} active={sel === c.companyName} onClick={() => setSp({ company: c.companyName })} />)}
              </div>
            </div>
          </aside>
          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 148 }} />)}</div>
            ) : visibleJobs.length === 0 ? (
              <EmptyState icon={<Briefcase size={36} />} title={COPY.jobs.noJobsTitle} body={COPY.jobs.noJobsBody} action={<Button variant="ghost" onClick={clearAllFilters}>{COPY.jobs.clearFilters}</Button>} />
            ) : (
              <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 180px)', overflow: 'hidden', border: '1.25px solid var(--border)', borderRadius: 14, background: 'var(--surface-solid)' }}>
                {/* ── Left Panel: Job List ── */}
                <div className="thin-scroll" style={{ width: isMobile ? '100%' : 380, flexShrink: 0, overflowY: 'auto', borderRight: isMobile ? 'none' : '1.25px solid var(--border)' }}>
                  {visibleJobs.map(j => <JobListItem key={j._id} job={j} />)}
                  {/* Infinite-scroll sentinel */}
                  {hasMore && (
                    <div ref={sentinelRef} style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                      {loadingMore && <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />}
                    </div>
                  )}
                  {!hasMore && visibleJobs.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '0.75rem', color: 'var(--muted-ink)' }}>All jobs loaded</div>
                  )}
                </div>
                {/* ── Right Panel: Detail ── */}
                {!isMobile && (
                  <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
                    {selectedJob ? <DetailPanel job={selectedJob} /> : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <EmptyState icon={<Briefcase size={36} />} title="Select a job" body="Click a job on the left to view details." />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
