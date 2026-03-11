// FILE: src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, X, SlidersHorizontal, MapPin, Building2, Clock, ExternalLink } from 'lucide-react';
import type { IJob } from '../types';
import { Container, PageHeader, Button, Badge, EmptyState } from '../components/ui';
import { COPY } from '../theme/brand';

const ENTRY_LEVEL_KEYWORDS = ['junior', 'fresher', 'entry level', 'entry-level', 'trainee', 'graduate', 'associate', 'intern', '0-1 year', '0-2 year', 'freshers'];

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
  const [entryLevelOnly, setEntryLevelOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const isMobile = useIsMobile();
  useEffect(() => { document.title = COPY.site.documentTitleJobs; }, []);
  const sel = sp.get('company') || '';

  useEffect(() => {
    (async () => {
      setLoading(true); try {
        const dr = await fetch('/api/jobs/directory'); const dd: unknown = await dr.json();
        setCos(Array.isArray(dd) ? (dd as CS[]).filter(c => c.openRoles > 0) : []);
        const url = `/api/jobs?limit=100${sel ? `&company=${encodeURIComponent(sel)}` : ''}`;
        const jr = await fetch(url); const jd: { jobs?: IJob[] } = await jr.json(); setJobs(jd.jobs ?? []);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [sel]);

  const isEntryLevel = (job: IJob): boolean => {
    const title = job.JobTitle.toLowerCase();
    const desc = (job.Description ?? '').toLowerCase();
    return ENTRY_LEVEL_KEYWORDS.some(kw => title.includes(kw) || desc.includes(kw));
  };

  const visibleJobs = entryLevelOnly ? jobs.filter(isEntryLevel) : jobs;

  // Auto-select first job when list changes
  useEffect(() => {
    setSelectedJob(visibleJobs.length > 0 ? visibleJobs[0] : null);
  }, [entryLevelOnly, sel, loading]);

  const clearAllFilters = () => { setSp({}); setEntryLevelOnly(false); };

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
        onClick={() => isMobile ? window.open(job.ApplicationURL, '_blank', 'noopener,noreferrer') : setSelectedJob(job)}
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
        </div>
      </div>
    );
  };

  /* ── Right-panel detail view ── */
  const DetailPanel = ({ job }: { job: IJob }) => {
    const effectiveDate = job.PostedDate || job.scrapedAt || null;
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 48, height: 48, flexShrink: 0, background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 6 }}>
            <LogoImg job={job} size={48} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.02em' }}>{job.JobTitle}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}><Building2 size={13} />{job.Company}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}><MapPin size={13} />{job.Location}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}>
                <Clock size={13} />
                {effectiveDate ? `${COPY.jobs.postedPrefix} ${new Date(effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : COPY.jobs.postedNA}
              </span>
            </div>
          </div>
        </div>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {job.ContractType && job.ContractType !== 'N/A' && <Badge variant="neutral">{job.ContractType}</Badge>}
          {job.Department && job.Department !== 'N/A' && job.Department !== '' && <Badge variant="neutral">{job.Department}</Badge>}
        </div>
        {/* Apply */}
        <a href={job.ApplicationURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
          <Button size="lg" style={{ width: '100%', marginTop: 16 }}>{COPY.jobs.applyNow} <ExternalLink size={14} /></Button>
        </a>
        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />
        {/* Description */}
        <p className="font-sketch" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>About this role</p>
        <div style={{ fontSize: '0.875rem', lineHeight: 1.8, color: 'var(--muted-ink)', whiteSpace: 'pre-wrap', overflowY: 'auto', maxHeight: '55vh' }}>
          {job.Description || 'No description provided.'}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '32px 0' }}>
        <Container>
          <PageHeader label={COPY.jobs.pageLabel} title={sel || COPY.jobs.pageTitle}
            subtitle={`${visibleJobs.length} ${COPY.jobs.rolesAvailable}`}
            actions={sel ? <button onClick={clearAllFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1.25px solid var(--border)', background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>{sel}<X size={11} /></button> : undefined} />
        </Container>
      </div>
      <Container style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <aside style={{ width: 210, flexShrink: 0, position: 'sticky', top: 76 }} className="hidden md:block">
            <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={12} color="var(--primary)" />
                <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{COPY.jobs.experienceLabel}</span>
              </div>
              <div style={{ padding: 8 }}>
                <button onClick={() => setEntryLevelOnly(true)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: entryLevelOnly ? 'var(--primary-soft)' : 'transparent', color: entryLevelOnly ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: entryLevelOnly ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}
                  onMouseEnter={e => { if (!entryLevelOnly) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
                  onMouseLeave={e => { if (!entryLevelOnly) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                  {COPY.jobs.entryLevel}
                </button>
                <button onClick={() => setEntryLevelOnly(false)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: !entryLevelOnly ? 'var(--primary-soft)' : 'transparent', color: !entryLevelOnly ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: !entryLevelOnly ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}
                  onMouseEnter={e => { if (entryLevelOnly) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
                  onMouseLeave={e => { if (entryLevelOnly) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
                  {COPY.jobs.allLevels}
                </button>
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
              <EmptyState icon={<Briefcase size={36} />} title={COPY.jobs.noJobsTitle} body={entryLevelOnly ? COPY.jobs.noEntryJobsBody : COPY.jobs.noJobsBody} action={<Button variant="ghost" onClick={clearAllFilters}>{COPY.jobs.clearFilters}</Button>} />
            ) : (
              <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 180px)', overflow: 'hidden', border: '1.25px solid var(--border)', borderRadius: 14, background: 'var(--surface-solid)' }}>
                {/* ── Left Panel: Job List ── */}
                <div className="thin-scroll" style={{ width: isMobile ? '100%' : 380, flexShrink: 0, overflowY: 'auto', borderRight: isMobile ? 'none' : '1.25px solid var(--border)' }}>
                  {visibleJobs.map(j => <JobListItem key={j._id} job={j} />)}
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
