import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, X, ExternalLink, ArrowLeft, Search, CheckCircle2, Eye, EyeOff, Sparkles, GraduationCap } from 'lucide-react';
import { useUser } from '../context/UserContext';
import type { IJob } from '../types';
import { Container, PageHeader, Button, EmptyState } from '../components/ui';
import { COPY } from '../theme/brand';
import JobListItem from '../components/JobListItem';
import type { ICompany } from '../types';
import type { CompactBadge } from '../components/JobListItem';
import JobDetailPanel, { stripHtmlText, buildSkillsRegex, relTime, getAutoTags, roleBadgeStyle } from '../components/JobDetailPanel';
// Viewport info hook
function useViewportInfo() {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));
  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const { width, height } = viewport;
  const isXsSm = width < 640;
  const isMd = width >= 640 && width < 768;
  const isLg = width >= 768 && width < 1024;
  const is3xl = width >= 1536;
  const isShortLandscape = width > height && height < 500;
  const useSplitView = width >= 768 && height >= 500;
  return { isXsSm, isMd, isLg, is3xl, isShortLandscape, useSplitView };
}


function compactJobBadges(job: IJob): CompactBadge[] {
  const autoTags = getAutoTags(job);
  const badges: CompactBadge[] = [];
  if (autoTags.urgency === 'Urgent') badges.push({ key: 'urgent', label: 'Urgent', bg: '#fee2e2', color: '#b91c1c' });
  if (autoTags.roleCategory) {
    const tone = roleBadgeStyle(autoTags.roleCategory);
    badges.push({ key: 'role', label: autoTags.roleCategory, bg: tone.bg, color: tone.color });
  }
  if (autoTags.experienceBand) badges.push({ key: 'exp', label: autoTags.experienceBand, bg: 'var(--paper2)', color: 'var(--muted-ink)' });
  if (autoTags.isEntryLevel) badges.push({ key: 'entry', label: 'Fresher Friendly', bg: '#dcfce7', color: '#166534' });
  for (const tech of autoTags.techStack.slice(0, 2)) {
    badges.push({ key: `tech-${tech}`, label: tech, bg: 'var(--paper2)', color: 'var(--subtle-ink)' });
  }
  return badges.slice(0, 5);
}

// --- Filter option constants (restored as required) ---
const ROLE_FILTER_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Frontend', value: 'Frontend' },
  { label: 'Backend', value: 'Backend' },
  { label: 'Full Stack', value: 'Full Stack' },
  { label: 'DevOps', value: 'DevOps/SRE' },
  { label: 'Data', value: 'Data' },
  { label: 'Security', value: 'Security' },
  { label: 'ML/AI', value: 'ML/AI' },
  { label: 'Product', value: 'Product' },
  { label: 'Design', value: 'Design' },
  { label: 'QA', value: 'QA' },
  { label: 'Mobile', value: 'Mobile' },
  { label: 'Other', value: 'Other' },
] as const;

const EXPERIENCE_FILTER_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Fresher (0-1y)', value: 'Fresher (0-1y)' },
  { label: 'Junior (1-3y)', value: 'Junior (1-3y)' },
  { label: 'Mid (3-5y)', value: 'Mid (3-5y)' },
  { label: 'Senior (5-8y)', value: 'Senior (5-8y)' },
  { label: 'Staff+ (8y+)', value: 'Staff+ (8y+)' },
] as const;

const PAGE_SIZE = 30;

export default function Dashboard() {
  // URL params
  const [sp, setSp] = useSearchParams();
  const sel = sp.get('company') || '';
  const selectedJobParam = sp.get('selectedJob') || '';

  // Filters
  const [roleCategoryFilter, setRoleCategoryFilter] = useState<string | null>(null);
  const [experienceBandFilter, setExperienceBandFilter] = useState<string | null>(null);
  const [entryLevelFilter, setEntryLevelFilter] = useState<boolean>(false);
  const [workplaceFilter, setWorkplaceFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideApplied, setHideApplied] = useState<boolean>(false);
  const [showNewOnly, setShowNewOnly] = useState<boolean>(false);
  const [showComeBackOnly, setShowComeBackOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'match'>('default');

  // Pagination
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const [cos, setCos] = useState<ICompany[]>([]);

  // UI
  const [mobileSheetOpen, setMobileSheetOpen] = useState<boolean>(false);
  const [filterModalOpen, setFilterModalOpen] = useState<boolean>(false);

  // Refs
  const listRef = useRef<HTMLDivElement | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const visibleJobsRef = useRef<IJob[]>([]);
  const initializedSelectionRef = useRef<boolean>(false);
  const savedListScrollTopRef = useRef<number | null>(null);

  // Viewport and user context
  const { isXsSm, isLg, is3xl, isShortLandscape, useSplitView } = useViewportInfo();
  const useBottomSheet = !useSplitView;
  const { currentUser, userSkills, appliedJobIds, dismissedJobIds, previousVisitAt, toggleApplied, toggleDismissed } = useUser();

  // Active filter count for mobile badge
  const activeFilterCount = [roleCategoryFilter, experienceBandFilter, workplaceFilter, dateFilter, platformFilter, sel, entryLevelFilter, hideApplied, showNewOnly, showComeBackOnly].filter(Boolean).length;

  // Style helpers
  const activeChipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 2,
    padding: '5px 12px', borderRadius: 999,
    background: 'var(--primary-soft)', border: '1.25px solid var(--primary)',
    color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
    transition: 'all 0.15s', flexShrink: 0, maxWidth: '100%',
  };
  const desktopSelectStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px', borderRadius: 999,
    border: '1.25px solid var(--border)',
    background: active ? 'var(--primary-soft)' : 'var(--surface-solid)',
    color: active ? 'var(--primary)' : 'var(--muted-ink)',
    fontFamily: 'inherit', fontSize: '0.82rem',
  });
  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 999,
    border: active ? '1.5px solid var(--primary)' : '1.25px solid var(--border)',
    background: active ? 'var(--primary)' : 'var(--surface-solid)',
    color: active ? '#fff' : 'var(--ink)',
    cursor: 'pointer', fontSize: '0.84rem', fontFamily: 'inherit',
    fontWeight: active ? 600 : 400, transition: 'all 0.15s',
    whiteSpace: 'nowrap', flexShrink: 0,
  });



  // Dismiss with 5-second undo window
  interface PendingDismiss { jobId: string; timer: ReturnType<typeof setTimeout> }
  const [pendingDismiss, setPendingDismiss] = useState<PendingDismiss | null>(null);

  const handleDismiss = useCallback((jobId: string) => {
    if (!currentUser) return;
    // Clear any existing pending dismiss without firing the API (user dismissed another job)
    if (pendingDismiss) {
      clearTimeout(pendingDismiss.timer);
      toggleDismissed(pendingDismiss.jobId); // fire the previous one immediately
    }
    // Optimistic: add to dismissed set immediately for instant UI removal
    toggleDismissed(jobId);
    // Schedule real API call with 5-second undo window
    const timer = setTimeout(() => {
      setPendingDismiss(null);
      // API already fired via toggleDismissed above (optimistic)
    }, 5000);
    setPendingDismiss({ jobId, timer });
  }, [currentUser, pendingDismiss, toggleDismissed]);

  const handleUndoDismiss = useCallback(() => {
    if (!pendingDismiss) return;
    clearTimeout(pendingDismiss.timer);
    toggleDismissed(pendingDismiss.jobId); // calls DELETE — undoes the dismiss
    setPendingDismiss(null);
  }, [pendingDismiss, toggleDismissed]);

  // ComeBack logic
  const [comeBackMap, setComeBackMap] = useState<Map<string, { note: string; addedAt: string }>>(new Map());
  useEffect(() => {
    if (!currentUser) { setComeBackMap(new Map()); return; }
    let cancelled = false;
    fetch(`/api/users/${encodeURIComponent(currentUser.slug)}/comeback`)
      .then(r => r.ok ? r.json() : [])
      .then((entries: { jobId: string; note: string; addedAt: string }[]) => {
        if (!cancelled) setComeBackMap(new Map(entries.map(e => [e.jobId, { note: e.note, addedAt: e.addedAt }])));
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [currentUser?.slug]);

  const toggleComeBack = useCallback((jobId: string, note: string) => {
    if (!currentUser) return;
    const slug = encodeURIComponent(currentUser.slug);
    const id = encodeURIComponent(jobId);
    setComeBackMap(prev => { const next = new Map(prev); next.set(jobId, { note, addedAt: new Date().toISOString() }); return next; });
    fetch(`/api/users/${slug}/comeback/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }),
    }).then(r => r.ok ? r.json() : null)
      .then((entries: { jobId: string; note: string; addedAt: string }[] | null) => {
        if (entries) setComeBackMap(new Map(entries.map(e => [e.jobId, { note: e.note, addedAt: e.addedAt }])));
      }).catch(() => { });
  }, [currentUser]);

  const removeComeBack = useCallback((jobId: string) => {
    if (!currentUser) return;
    const slug = encodeURIComponent(currentUser.slug);
    const id = encodeURIComponent(jobId);
    setComeBackMap(prev => { const next = new Map(prev); next.delete(jobId); return next; });
    fetch(`/api/users/${slug}/comeback/${id}`, { method: 'DELETE' })
      .then(r => r.ok ? r.json() : null)
      .then((entries: { jobId: string; note: string; addedAt: string }[] | null) => {
        if (entries) setComeBackMap(new Map(entries.map(e => [e.jobId, { note: e.note, addedAt: e.addedAt }])));
      }).catch(() => { });
  }, [currentUser]);

  const handleToggleApplied = useCallback(async (jobId: string) => {
    if (!currentUser) return;
    const wasApplied = appliedJobIds.has(jobId);
    await toggleApplied(jobId);
    if (!wasApplied && comeBackMap.has(jobId)) removeComeBack(jobId);
  }, [currentUser, appliedJobIds, toggleApplied, comeBackMap, removeComeBack]);

  const handleSelectJob = useCallback((job: IJob) => {
    if (listRef.current) savedListScrollTopRef.current = listRef.current.scrollTop;
    setSp(prev => { const next = new URLSearchParams(prev); next.set('selectedJob', job._id); return next; });
    setSelectedJob(job);
    if (useBottomSheet) setMobileSheetOpen(true);
  }, [setSp, useBottomSheet]);

  const handleSelectJobById = useCallback(async (id: string) => {
    const found = jobs.find(j => j._id === id);
    if (found) {
      handleSelectJob(found);
    } else {
      try {
        const res = await fetch(`/api/jobs/${id}`);
        if (res.ok) {
          const jobData = await res.json();
          setJobs(prev => [jobData, ...prev]);
          handleSelectJob(jobData);
        }
      } catch (err) {
        console.error("Failed to fetch clicked job", err);
      }
    }
  }, [jobs, handleSelectJob]);

  useEffect(() => {
    if (mobileSheetOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSheetOpen]);
  useEffect(() => {
    if (!useBottomSheet) setMobileSheetOpen(false);
    if (!useBottomSheet) setFilterModalOpen(false);
  }, [useBottomSheet]);
  useEffect(() => { document.title = COPY.site.documentTitleJobs; }, []);
  // --- Server-side filter state ---
  const serverFilters = {
    roleCategory: roleCategoryFilter,
    experienceBand: experienceBandFilter,
    entryLevel: entryLevelFilter,
    workplace: workplaceFilter,
    platform: platformFilter,
    company: sel,
    date: dateFilter,
    search: searchQuery,
  };

  const fetchJobs = useCallback(async (pageNum: number, append: boolean, filters?: typeof serverFilters) => {
    const f = filters ?? serverFilters;
    if (append) { setIsLoadingMore(true); }
    else { setLoading(true); setCurrentPage(1); setJobs([]); }
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      if (f.company) params.set('company', f.company);
      if (f.roleCategory) params.set('roleCategory', f.roleCategory);
      if (f.experienceBand) params.set('experienceBand', f.experienceBand);
      if (f.entryLevel || f.experienceBand === 'Fresher (0-1y)') params.set('entryLevel', 'true');
      if (f.workplace) params.set('workplace', f.workplace);
      if (f.platform) params.set('platform', f.platform);
      // Server-side date + search
      if (f.date) params.set('date', f.date);
      if (f.search && f.search.trim().length >= 2) params.set('search', f.search.trim());
      const jr = await fetch(`/api/jobs?${params}`);
      const jd = await jr.json() as { jobs?: IJob[]; totalJobs?: number; totalPages?: number; currentPage?: number };
      const newJobs = jd.jobs ?? [];
      setTotalJobs(jd.totalJobs ?? 0);
      setTotalPages(jd.totalPages ?? 1);
      setCurrentPage(jd.currentPage ?? pageNum);
      setJobs(prev => append ? [...prev, ...newJobs] : newJobs);
    } catch (e) { console.error(e); }
    finally { if (append) setIsLoadingMore(false); else setLoading(false); }
  }, [sel, roleCategoryFilter, experienceBandFilter, entryLevelFilter, workplaceFilter, platformFilter, dateFilter, searchQuery]);

  useEffect(() => {
    fetchJobs(1, false);
  }, [sel, roleCategoryFilter, experienceBandFilter, entryLevelFilter, workplaceFilter, platformFilter, dateFilter, searchQuery]);
  // --- Load More logic ---
  const hasMore = currentPage < totalPages;

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    fetchJobs(nextPage, true);
    setCurrentPage(nextPage);
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/jobs/directory')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => { if (!cancelled) setCos(Array.isArray(data) ? data : []); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // Build a companyName -> domain map
  const companyDomainMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cos) {
      if (c.companyName && c.domain) map.set(c.companyName.trim().toLowerCase(), c.domain);
    }
    return map;
  }, [cos]);

  const newJobsCount = useMemo(() => {
    if (!currentUser || !previousVisitAt) return 0;
    const prev = new Date(previousVisitAt).getTime();
    if (Number.isNaN(prev)) return 0;
    return jobs.filter(job => {
      const d = new Date((job.PostedDate || '') as string).getTime();
      return !Number.isNaN(d) && d > prev && !appliedJobIds.has(job._id);
    }).length;
  }, [jobs, currentUser, previousVisitAt, appliedJobIds]);

  // Only client-side filters in visibleJobs
  const visibleJobs = useMemo(() => {
    return jobs.filter(job => {
      if (hideApplied && appliedJobIds.has(job._id)) return false;
      if (dismissedJobIds.has(job._id)) return false;
      if (currentUser && showComeBackOnly && !comeBackMap.has(job._id)) return false;
      if (showNewOnly) {
        if (!previousVisitAt) return false;
        const prev = new Date(previousVisitAt).getTime();
        const postedAt = new Date((job.PostedDate || '') as string).getTime();
        if (Number.isNaN(prev) || Number.isNaN(postedAt) || postedAt <= prev || appliedJobIds.has(job._id)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy !== 'match' || !userSkills.length) return 0;
      const textA = stripHtmlText(a.DescriptionCleaned || a.Description || '');
      const textB = stripHtmlText(b.DescriptionCleaned || b.Description || '');
      const scoreA = userSkills.reduce((acc, skill) => {
        const re = buildSkillsRegex([skill]);
        return acc + (re && re.test(textA) ? 1 : 0);
      }, 0);
      const scoreB = userSkills.reduce((acc, skill) => {
        const re = buildSkillsRegex([skill]);
        return acc + (re && re.test(textB) ? 1 : 0);
      }, 0);
      return scoreB - scoreA;
    });
  }, [jobs, hideApplied, showComeBackOnly, showNewOnly, previousVisitAt, appliedJobIds, dismissedJobIds, comeBackMap, sortBy, userSkills]);

  useEffect(() => {
    visibleJobsRef.current = visibleJobs;
  }, [visibleJobs]);

  const listRenderMeta = useMemo(() => {
    return visibleJobs.map(job => {
      const isApplied = appliedJobIds.has(job._id);
      const isComeBack = comeBackMap.has(job._id);
      const comeBackNote = comeBackMap.get(job._id)?.note || '';
      const isNew = !!(currentUser && previousVisitAt && new Date((job.PostedDate || job.scrapedAt || '') as string).getTime() > new Date(previousVisitAt).getTime() && !isApplied);
      const relativeTime = relTime((job.PostedDate || job.scrapedAt || null) as string | null);
      const visibleBadges = compactJobBadges(job);
      const text = stripHtmlText(job.DescriptionCleaned || job.Description || '');
      const matchedCount = userSkills.reduce((acc, skill) => {
        const re = buildSkillsRegex([skill]);
        return acc + (re && re.test(text) ? 1 : 0);
      }, 0);
      const showSkillMatch = userSkills.length > 0 && matchedCount > 0;
      const skillMatchText = `${matchedCount}/${userSkills.length} skills`;
      const skillMatchBg = matchedCount <= 2 ? '#fef3c7' : '#dcfce7';
      const skillMatchColor = matchedCount <= 2 ? '#92400e' : '#166534';
      return { job, isApplied, isComeBack, comeBackNote, isNew, relativeTime, visibleBadges, showSkillMatch, skillMatchText, skillMatchBg, skillMatchColor };
    });
  }, [visibleJobs, appliedJobIds, comeBackMap, currentUser, previousVisitAt, userSkills]);

  const filterSelectionKey = useMemo(() => JSON.stringify({
    workplaceFilter,
    platformFilter,
    dateFilter,
    sel,
    searchQuery,
    hideApplied,
    entryLevelFilter,
    roleCategoryFilter,
    experienceBandFilter,
    showNewOnly,
    showComeBackOnly,
  }), [
    workplaceFilter,
    platformFilter,
    dateFilter,
    sel,
    searchQuery,
    hideApplied,
    entryLevelFilter,
    roleCategoryFilter,
    experienceBandFilter,
    showNewOnly,
    showComeBackOnly,
  ]);

  // Initial load selection only once
  useEffect(() => {
    if (initializedSelectionRef.current) return;
    if (useBottomSheet) return;

    if (selectedJobParam) {
      initializedSelectionRef.current = true;
      const found = visibleJobsRef.current.find(j => j._id === selectedJobParam);
      if (found) {
        setSelectedJob(found);
      } else {
        fetch(`/api/jobs/${selectedJobParam}`)
          .then(r => r.ok ? r.json() : null)
          .then((job: IJob | null) => {
            if (job) {
              setJobs(prev => [job, ...prev]);
              setSelectedJob(job);
            } else if (visibleJobsRef.current.length > 0) {
              setSelectedJob(visibleJobsRef.current[0]);
            }
          })
          .catch(() => {
            if (visibleJobsRef.current.length > 0) setSelectedJob(visibleJobsRef.current[0]);
          });
      }
      return;
    }

    if (loading) return;
    if (visibleJobs.length === 0) {
      setSelectedJob(null);
      return;
    }
    setSelectedJob(visibleJobs[0]);
    initializedSelectionRef.current = true;
  }, [loading, visibleJobs, selectedJobParam, useBottomSheet]);

  // Filter/search changes should reset list position and select first result
  useEffect(() => {
    if (selectedJobParam || useBottomSheet) return;
    const jobsNow = visibleJobsRef.current;
    if (jobsNow.length === 0) {
      setSelectedJob(null);
      if (listRef.current) listRef.current.scrollTop = 0;
      return;
    }
    setSelectedJob(jobsNow[0]);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [filterSelectionKey, selectedJobParam, useBottomSheet]);

  useEffect(() => {
    if (savedListScrollTopRef.current !== null && listRef.current) {
      listRef.current.scrollTop = savedListScrollTopRef.current;
      savedListScrollTopRef.current = null;
    }
  }, [selectedJob?._id]);

  useEffect(() => {
    if (detailPanelRef.current) {
      detailPanelRef.current.scrollTop = 0;
    }
  }, [selectedJob?._id]);

  const clearAllFilters = () => {
    setSp({});
    setWorkplaceFilter(null);
    setPlatformFilter(null);
    setDateFilter(null);
    setSearchQuery('');
    setHideApplied(false);
    setShowNewOnly(false);
    setEntryLevelFilter(false);
    setRoleCategoryFilter(null);
    setExperienceBandFilter(null);
    setSortBy('default');
    setShowComeBackOnly(false);
    setCurrentPage(1);
  };

  const activeMobileFilters = [
    roleCategoryFilter ? { label: roleCategoryFilter, clear: () => setRoleCategoryFilter(null) } : null,
    experienceBandFilter ? { label: experienceBandFilter, clear: () => setExperienceBandFilter(null) } : null,
    workplaceFilter ? { label: workplaceFilter === 'on-site' ? 'On-site' : workplaceFilter[0].toUpperCase() + workplaceFilter.slice(1), clear: () => setWorkplaceFilter(null) } : null,
    dateFilter ? { label: dateFilter === '1d' ? 'Past 24h' : dateFilter === '3d' ? 'Past 3 days' : 'Past week', clear: () => setDateFilter(null) } : null,
    platformFilter ? { label: platformFilter[0].toUpperCase() + platformFilter.slice(1), clear: () => setPlatformFilter(null) } : null,
    sel ? { label: sel, clear: () => setSp({}) } : null,
    entryLevelFilter ? { label: 'Fresher', clear: () => setEntryLevelFilter(false) } : null,
    hideApplied ? { label: 'Hide applied', clear: () => setHideApplied(false) } : null,
    showNewOnly ? { label: 'New only', clear: () => setShowNewOnly(false) } : null,
    showComeBackOnly ? { label: 'Come back later', clear: () => setShowComeBackOnly(false) } : null,
  ].filter((item): item is { label: string; clear: () => void } => Boolean(item));


  const SheetActions = ({ job }: { job: IJob }) => {
    const applied = appliedJobIds.has(job._id);
    return (
      <div className="mobile-sticky-actions" style={{
        display: 'flex',
        flexDirection: isXsSm ? 'column' : 'row',
        gap: 10,
      }}>
        <a href={job.DirectApplyURL || job.ApplicationURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1 }}>
          <Button size="lg" style={{ width: '100%', minHeight: 44 }}>{COPY.jobs.applyNow} <ExternalLink size={14} /></Button>
        </a>
        {currentUser && (
          <button
            onClick={() => handleToggleApplied(job._id)}
            style={{
              minHeight: 44,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
              fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
              transition: 'all 0.18s', flexShrink: 0,
              background: applied ? 'var(--primary)' : 'transparent',
              color: applied ? '#fff' : 'var(--primary)',
              border: '1.5px solid var(--primary)',
              width: isXsSm ? '100%' : 'auto',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={15} />
            {applied ? 'Applied' : 'Mark Applied'}
          </button>
        )}
      </div>
    );
  };

  const closeMobileSheet = () => setMobileSheetOpen(false);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100dvh' }}>
      {/* Keyframe animations for mobile sheet */}
      <style>{`
        @keyframes sheetFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes sheetSlideDown { from { transform: translateY(0) } to { transform: translateY(100%) } }
        .job-description-html h2,
        .job-description-html h3 { margin-top: 20px; font-weight: 600; }
        @keyframes toastIn { from { transform: translateY(80px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
      {/* ── Dismiss undo toast ──────── */}
      {pendingDismiss && (
        <div style={{
          position: 'fixed', bottom: isXsSm ? 'max(12px, env(safe-area-inset-bottom))' : 24, left: isXsSm ? 16 : '50%', right: isXsSm ? 16 : 'auto', transform: isXsSm ? 'none' : 'translateX(-50%)',
          background: 'var(--ink)', color: 'var(--paper)',
          borderRadius: 12, padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          zIndex: 9999, fontSize: '0.88rem', fontWeight: 500,
          animation: 'toastIn 0.25s ease',
          whiteSpace: isXsSm ? 'normal' : 'nowrap',
          maxWidth: isXsSm ? 'none' : 'min(90vw, 520px)',
        }}>
          <span>Job hidden.</span>
          <button
            onClick={handleUndoDismiss}
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8, color: 'inherit', fontFamily: 'inherit',
              fontSize: '0.82rem', fontWeight: 700, padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            Undo
          </button>
        </div>
      )}
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '10px 0' }}>
        <Container style={is3xl ? { maxWidth: 1600 } : undefined}>
          {!currentUser && (
            <div style={{
              marginBottom: 12, padding: '10px 14px', borderRadius: 10,
              background: 'var(--primary-soft)', border: '1px solid var(--primary)',
              display: 'flex', alignItems: isXsSm ? 'stretch' : 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
                <strong style={{ color: 'var(--primary)' }}>Browsing as guest</strong> — sign in to track applications, filter by skills, hide applied jobs & more
              </span>
              <a href="/login" style={{
                padding: '6px 14px', borderRadius: 8, background: 'var(--primary)',
                color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600,
                width: isXsSm ? '100%' : 'auto', textAlign: 'center'
              }}>Sign In</a>
            </div>
          )}
          <PageHeader
            label={COPY.jobs.pageLabel}
            title={sel || COPY.jobs.pageTitle}
            subtitle={currentUser ? `${visibleJobs.length} shown · ${totalJobs} total roles available` : undefined}
            actions={sel && currentUser ? <button onClick={clearAllFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1.25px solid var(--border)', background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>{sel}<X size={11} /></button> : undefined}
          />
        </Container>
      </div>
      <Container style={{ paddingTop: isXsSm ? 20 : 28, paddingBottom: isXsSm ? 24 : 32, maxWidth: is3xl ? 1600 : undefined }}>
        <div style={{ minWidth: 0 }}>
          {/* Search bar + filter button */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-ink)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title, company, location, or tech stack..."
                style={{
                  width: '100%', height: 48, padding: '10px 36px 10px 38px', borderRadius: 12,
                  border: '1.25px solid var(--border)', background: 'var(--surface-solid)',
                  color: 'var(--ink)', fontSize: isXsSm ? 16 : '0.92rem', fontFamily: 'inherit',
                  outline: 'none', transition: 'border-color 0.18s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--muted-ink)', display: 'flex', alignItems: 'center', padding: 2,
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
          {/* Sort by skills row — only when user has skills and is logged in */}
          {currentUser && userSkills.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted-ink)' }}>Sort by:</span>
              <button
                onClick={() => setSortBy(v => v === 'match' ? 'default' : 'match')}
                style={{
                  padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontFamily: 'inherit',
                  border: sortBy === 'match' ? '1.5px solid var(--primary)' : '1.25px solid var(--border)',
                  background: sortBy === 'match' ? 'var(--primary)' : 'transparent',
                  color: sortBy === 'match' ? '#fff' : 'var(--muted-ink)',
                  cursor: 'pointer', fontWeight: sortBy === 'match' ? 600 : 400, transition: 'all 0.18s',
                }}
              >
                ✶ Best match
              </button>
              {sortBy === 'match' && (
                <button
                  onClick={() => setSortBy('default')}
                  style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontFamily: 'inherit', border: '1.25px solid var(--border)', background: 'transparent', color: 'var(--muted-ink)', cursor: 'pointer', transition: 'all 0.18s' }}
                >
                  Default
                </button>
              )}
            </div>
          )}
          {/* ══ FILTER AREA ══ */}
          {useBottomSheet ? (
            <div style={{ padding: '10px 0 14px', marginBottom: 8 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isXsSm ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
                  gap: 8,
                  padding: 10,
                  borderRadius: 18,
                  border: '1px solid var(--border)',
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary-soft) 16%, transparent), color-mix(in srgb, var(--surface-solid) 90%, transparent))',
                }}
              >
                <button
                  onClick={() => setFilterModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: activeFilterCount > 0 ? '1.5px solid var(--primary)' : '1.25px solid var(--border)',
                    background: activeFilterCount > 0 ? 'var(--primary-soft)' : 'var(--surface-solid)',
                    color: activeFilterCount > 0 ? 'var(--primary)' : 'var(--ink)',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    transition: 'all 0.18s',
                    gridColumn: '1 / -1',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ width: 34, height: 34, borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block' }}>Browse filters</span>
                      <span style={{ display: 'block', marginTop: 2, fontSize: '0.72rem', fontWeight: 500, color: activeFilterCount > 0 ? 'var(--primary)' : 'var(--muted-ink)' }}>
                        {activeFilterCount > 0 ? `${activeFilterCount} active right now` : 'Role, date, board, company, and more'}
                      </span>
                    </span>
                  </span>
                  <span style={{ fontSize: '0.9rem', color: activeFilterCount > 0 ? 'var(--primary)' : 'var(--subtle-ink)' }}>Open</span>
                </button>

                {currentUser && (
                  <button
                    onClick={() => setHideApplied(h => !h)}
                    style={{
                      ...pillStyle(hideApplied),
                      padding: '11px 12px',
                      borderRadius: 14,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {hideApplied ? <><EyeOff size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Hidden</> : <><Eye size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Applied</>}
                  </button>
                )}

                <button
                  onClick={() => setEntryLevelFilter(f => !f)}
                  style={{
                      ...pillStyle(entryLevelFilter),
                      padding: '11px 12px',
                      borderRadius: 14,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                  }}
                >
                  <GraduationCap size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Fresher
                </button>

                {currentUser && newJobsCount > 0 && (
                  <button
                    onClick={() => setShowNewOnly(n => !n)}
                    style={{
                      ...pillStyle(showNewOnly),
                      padding: '11px 12px',
                      borderRadius: 14,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={13} style={{ verticalAlign: -2, marginRight: 6 }} />New
                  </button>
                )}
              </div>

              {activeMobileFilters.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {activeMobileFilters.map(filter => (
                    <button key={filter.label} onClick={filter.clear} style={activeChipStyle}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{filter.label}</span>
                      <X size={11} style={{ marginLeft: 4, flexShrink: 0 }} />
                    </button>
                  ))}
                  <button onClick={clearAllFilters} style={{ ...activeChipStyle, background: 'transparent', border: '1px dashed var(--border)', color: 'var(--muted-ink)' }}>
                    Clear all
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, padding: '12px 0 14px', marginBottom: 12, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <select value={roleCategoryFilter ?? ''} onChange={e => setRoleCategoryFilter(e.target.value || null)} style={desktopSelectStyle(!!roleCategoryFilter)}><option value="">Role: All</option>{ROLE_FILTER_OPTIONS.filter(o => o.value).map(opt => <option key={opt.label} value={opt.value!}>{opt.label}</option>)}</select>
              <select value={experienceBandFilter ?? ''} onChange={e => setExperienceBandFilter(e.target.value || null)} style={desktopSelectStyle(!!experienceBandFilter)}><option value="">Exp: All</option>{EXPERIENCE_FILTER_OPTIONS.filter(o => o.value).map(opt => <option key={opt.label} value={opt.value!}>{opt.label}</option>)}</select>
              <select value={workplaceFilter ?? ''} onChange={e => setWorkplaceFilter(e.target.value || null)} style={desktopSelectStyle(!!workplaceFilter)}><option value="">Workplace: All</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on-site">On-site</option></select>
              <select value={dateFilter ?? ''} onChange={e => setDateFilter(e.target.value || null)} style={desktopSelectStyle(!!dateFilter)}><option value="">Date: All</option><option value="1d">Past 24h</option><option value="3d">Past 3d</option><option value="7d">Past 7d</option></select>
              <select value={platformFilter ?? ''} onChange={e => setPlatformFilter(e.target.value || null)} style={desktopSelectStyle(!!platformFilter)}><option value="">Board: All</option><option value="lever">Lever</option><option value="greenhouse">Greenhouse</option><option value="ashby">Ashby</option><option value="workable">Workable</option><option value="recruitee">Recruitee</option><option value="workday">Workday</option></select>
              <select value={sel} onChange={e => { const company = e.target.value; if (!company) { setSp({}); } else { setSp({ company }); } }} style={desktopSelectStyle(!!sel)}><option value="">Companies: All</option>{cos.map(c => <option key={c.companyName} value={c.companyName}>{c.companyName}</option>)}</select>
            </div>
          )}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 148 }} />)}</div>
          ) : visibleJobs.length === 0 ? (
            <EmptyState icon={<Briefcase size={36} />} title={searchQuery ? 'No jobs match your filters' : COPY.jobs.noJobsTitle} body={searchQuery ? 'No jobs match your filters. Try adjusting or clearing them.' : COPY.jobs.noJobsBody} action={<Button variant="ghost" onClick={clearAllFilters}>{COPY.jobs.clearFilters}</Button>} />
          ) : (
            <div style={{ display: 'flex', flexDirection: useBottomSheet ? 'column' : 'row', gap: 0, height: useBottomSheet ? 'auto' : 'min(calc(100dvh - 220px), 920px)', minHeight: useBottomSheet ? 0 : 420, overflow: useBottomSheet ? 'visible' : 'hidden', border: '1.25px solid var(--border)', borderRadius: useBottomSheet ? 12 : 14, background: 'var(--surface-solid)' }}>
              {/* Left Panel: Job List */}
              <div ref={listRef} className="thin-scroll" style={{
                width: useBottomSheet ? '100%' : (is3xl ? 320 : isLg ? '40%' : '30%'),
                minWidth: useBottomSheet ? 0 : (is3xl ? 320 : 280),
                flexShrink: 0,
                overflowY: useBottomSheet ? 'visible' : 'auto',
                borderRight: useBottomSheet ? 'none' : '1.25px solid var(--border)',
                WebkitOverflowScrolling: 'touch',
              }}>
                {listRenderMeta.map(meta => {
                  const j = meta.job;
                  // Look up domain from map
                  const domain = companyDomainMap.get(j.Company?.trim().toLowerCase() || '');
                  return (
                    <JobListItem
                      key={j._id}
                      job={j}
                      domain={domain}
                      isSelected={selectedJob?._id === j._id}
                      isApplied={meta.isApplied}
                      isComeBack={meta.isComeBack}
                      comeBackNote={meta.comeBackNote}
                      isNew={meta.isNew}
                      relativeTime={meta.relativeTime}
                      visibleBadges={meta.visibleBadges}
                      showSkillMatch={meta.showSkillMatch}
                      skillMatchText={meta.skillMatchText}
                      skillMatchBg={meta.skillMatchBg}
                      skillMatchColor={meta.skillMatchColor}
                      onSelect={handleSelectJob}
                      onDismiss={currentUser ? handleDismiss : undefined}
                    />
                  );
                })}
                {visibleJobs.length > 0 && (
                  <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '0.75rem', color: 'var(--muted-ink)' }}>Showing {visibleJobs.length} jobs</div>
                )}
                {hasMore && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '18px 0 12px 0' }}>
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      style={{
                        background: 'transparent',
                        border: '1.25px solid var(--border)',
                        borderRadius: 10,
                        color: 'var(--muted-ink)',
                        padding: '8px 22px',
                        fontSize: 15,
                        cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                        marginTop: 8,
                        minWidth: isXsSm ? '100%' : 180,
                        width: isXsSm ? '100%' : undefined,
                        maxWidth: 320,
                        transition: 'background 0.2s',
                        opacity: isLoadingMore ? 0.7 : 1,
                      }}
                    >
                      {isLoadingMore ? 'Loading...' : `Load more jobs (${Math.max(totalJobs - jobs.length, 0)} remaining)`}
                    </button>
                  </div>
                )}
              </div>
              {/* Right Panel: Detail */}
              {!useBottomSheet && (
                <div ref={detailPanelRef} className="thin-scroll" style={{ width: isLg ? '60%' : '70%', flex: isLg ? '1 1 60%' : '1 1 70%', overflowY: 'auto', overflowX: 'hidden', padding: is3xl ? '28px 36px' : '24px 32px', WebkitOverflowScrolling: 'touch' }}>
                  {selectedJob ? (
                    <JobDetailPanel
                      job={selectedJob}
                      domain={companyDomainMap.get(selectedJob.Company?.trim().toLowerCase() || '')}
                      is3xl={is3xl}
                      appliedJobIds={appliedJobIds}
                      comeBackMap={comeBackMap}
                      onToggleApplied={handleToggleApplied}
                      onToggleComeBack={toggleComeBack}
                      onRemoveComeBack={removeComeBack}
                      onSelectJob={handleSelectJobById}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <EmptyState icon={<Briefcase size={36} />} title="Select a job" body="Click a job on the left to view details." />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Container>

      {/* Mobile/tablet bottom sheet */}
      {useBottomSheet && mobileSheetOpen && selectedJob && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeMobileSheet}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.45)',
              animation: 'sheetFadeIn 0.2s ease',
            }}
          />
          {/* Sheet */}
          <div
            onTouchStart={e => {
              const touch = e.touches[0];
              (e.currentTarget as HTMLDivElement).dataset.touchStartY = String(touch.clientY);
            }}
            onTouchEnd={e => {
              const startY = Number((e.currentTarget as HTMLDivElement).dataset.touchStartY || '0');
              const endY = e.changedTouches[0]?.clientY ?? startY;
              if (endY - startY > 50) closeMobileSheet();
            }}
            style={{
              position: 'fixed',
              left: 0, right: 0, bottom: 0,
              height: isShortLandscape ? '100dvh' : (isXsSm ? '92dvh' : '84dvh'),
              maxHeight: '100dvh',
              zIndex: 201,
              background: 'var(--surface-solid)',
              borderRadius: '20px 20px 0 0',
              display: 'flex', flexDirection: 'column',
              animation: 'sheetSlideUp 0.28s ease',
            }}
          >
            {/* Sticky header */}
            <div style={{
              padding: '18px 16px 10px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <button
                onClick={closeMobileSheet}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              {/* Drag handle (decorative) */}
              <div style={{
                width: 36, height: 4, borderRadius: 2,
                background: 'var(--border-strong)',
                position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 8,
              }} />
              <div style={{ width: 60 }} />{/* spacer for centering */}
            </div>
            {/* Scrollable content */}
            <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isXsSm ? '16px 14px 8px' : '20px 18px 16px', WebkitOverflowScrolling: 'touch' }}>
              <JobDetailPanel
                job={selectedJob}
                mobileMode
                is3xl={is3xl}
                appliedJobIds={appliedJobIds}
                comeBackMap={comeBackMap}
                onToggleApplied={handleToggleApplied}
                onToggleComeBack={toggleComeBack}
                onRemoveComeBack={removeComeBack}
                onSelectJob={handleSelectJobById}
              />
            </div>
            <SheetActions job={selectedJob} />
          </div>
        </>
      )}

      {/* ── Mobile Filter Bottom Sheet ── */}
      {useBottomSheet && filterModalOpen && (
        <>
          <div onClick={() => setFilterModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 220, animation: 'sheetFadeIn 0.2s ease' }} />
          <div
            className="thin-scroll"
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0,
              maxHeight: '85dvh', overflowY: 'auto', overflowX: 'hidden',
              borderRadius: '24px 24px 0 0',
              border: '1.25px solid var(--border)', borderBottom: 'none',
              background: 'var(--surface-solid)',
              padding: '0 0 max(16px, env(safe-area-inset-bottom))',
              zIndex: 221,
              animation: 'sheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Handle + header */}
            <div style={{ position: 'sticky', top: 0, background: 'var(--surface-solid)', zIndex: 2, padding: '10px 20px 12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 12px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>Filters</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {activeFilterCount > 0 && <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>Clear all</button>}
                  <button onClick={() => setFilterModalOpen(false)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
                </div>
              </div>
            </div>

            {/* Filter sections */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Role Category */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Role</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button onClick={() => setRoleCategoryFilter(null)} style={pillStyle(!roleCategoryFilter)}>All</button>
                  {ROLE_FILTER_OPTIONS.filter(o => o.value).map(opt => (
                    <button key={opt.label} onClick={() => setRoleCategoryFilter(roleCategoryFilter === opt.value ? null : (opt.value ?? null))} style={pillStyle(roleCategoryFilter === opt.value)}>{opt.label}</button>
                  ))}
                </div>
              </div>
              {/* Experience */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Experience</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button onClick={() => setExperienceBandFilter(null)} style={pillStyle(!experienceBandFilter)}>All</button>
                  {EXPERIENCE_FILTER_OPTIONS.filter(o => o.value).map(opt => (
                    <button key={opt.label} onClick={() => setExperienceBandFilter(experienceBandFilter === opt.value ? null : (opt.value ?? null))} style={pillStyle(experienceBandFilter === opt.value)}>{opt.label}</button>
                  ))}
                </div>
              </div>
              {/* Workplace */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Workplace</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[{ l: 'All', v: null }, { l: 'Remote', v: 'remote' }, { l: 'Hybrid', v: 'hybrid' }, { l: 'On-site', v: 'on-site' }].map(o => (
                    <button key={o.l} onClick={() => setWorkplaceFilter(workplaceFilter === o.v ? null : o.v)} style={pillStyle(workplaceFilter === o.v)}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Date */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Posted</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[{ l: 'Any time', v: null }, { l: 'Past 24h', v: '1d' }, { l: 'Past 3 days', v: '3d' }, { l: 'Past week', v: '7d' }].map(o => (
                    <button key={o.l} onClick={() => setDateFilter(dateFilter === o.v ? null : o.v)} style={pillStyle(dateFilter === o.v)}>{o.l}</button>
                  ))}
                </div>
              </div>
              {/* Platform */}
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Job Board</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[{ l: 'All', v: null }, { l: 'Lever', v: 'lever' }, { l: 'Greenhouse', v: 'greenhouse' }, { l: 'Ashby', v: 'ashby' }, { l: 'Workable', v: 'workable' }, { l: 'Recruitee', v: 'recruitee' }, { l: 'Workday', v: 'workday' }].map(o => (
                    <button key={o.l} onClick={() => setPlatformFilter(platformFilter === o.v ? null : o.v)} style={pillStyle(platformFilter === o.v)}>{o.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Company</p>
                <select
                  value={sel}
                  onChange={e => {
                    const company = e.target.value;
                    if (!company) {
                      setSp({});
                    } else {
                      setSp({ company });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-solid)',
                    color: sel ? 'var(--ink)' : 'var(--muted-ink)',
                    fontFamily: 'inherit',
                    fontSize: '0.88rem',
                  }}
                >
                  <option value="">All companies</option>
                  {cos.map(c => <option key={c.companyName} value={c.companyName}>{c.companyName}</option>)}
                </select>
              </div>
            </div>

            {/* Sticky apply button */}
            <div style={{ position: 'sticky', bottom: 0, padding: '12px 20px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: 'var(--surface-solid)', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setFilterModalOpen(false)}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12,
                  background: 'var(--primary)', color: '#fff', border: 'none',
                  fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'opacity 0.15s',
                }}
              >
                Show {visibleJobs.length} jobs
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
