// FILE: src/pages/Dashboard.tsx
// Full-featured jobs dashboard. Server-side filters, split view on desktop, bottom sheet on mobile.

import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { useUser } from '../context/UserContext';
import type { IJob, ICompany } from '../types';
import type { CompactBadge } from '../components/JobListItem';
import { Container, PageHeader, Button, EmptyState } from '../components/ui';
import { COPY } from '../theme/brand';
import JobListItem from '../components/JobListItem';
import JobDetailPanel, {
  buildSkillsRegex, relTime, getAutoTags, roleBadgeStyle,
} from '../components/JobDetailPanel';
import DashboardJobSheet from '../components/DashboardJobSheet';
import DashboardFilterSheet from '../components/DashboardFilterSheet';
import DashboardSearchBar from '../components/DashboardSearchBar';
import DashboardMobileFilters from '../components/DashboardMobileFilters';
import DashboardFilterBar from '../components/DashboardFilterBar';

function useVp() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));
  useEffect(() => {
    const fn = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { ...vp, isMobile: vp.w < 768, useSplit: vp.w >= 768 && vp.h >= 500 };
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'Frontend', label: 'Frontend' },
  { value: 'Backend', label: 'Backend' },
  { value: 'Full Stack', label: 'Full Stack' },
  { value: 'DevOps/SRE', label: 'DevOps' },
  { value: 'Data', label: 'Data' },
  { value: 'Security', label: 'Security' },
  { value: 'ML/AI', label: 'ML/AI' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'QA', label: 'QA' },
  { value: 'Mobile', label: 'Mobile' },
];

const EXPERIENCE_OPTIONS = [
  { value: 'all', label: 'All experience' },
  { value: 'Fresher (0-1y)', label: 'Fresher (0-1y)' },
  { value: 'Junior (1-3y)', label: 'Junior (1-3y)' },
  { value: 'Mid (3-5y)', label: 'Mid (3-5y)' },
  { value: 'Senior (5-8y)', label: 'Senior (5-8y)' },
  { value: 'Staff+ (8y+)', label: 'Staff+ (8y+)' },
];

const PAGE_SIZE = 30;

const desktopSelectStyle: CSSProperties = {
  padding: '8px 28px 8px 12px',
  fontFamily: 'inherit', fontSize: '0.82rem',
  background: 'var(--surface)', color: 'var(--ink)',
  border: '1px solid var(--border-strong)', borderRadius: 9,
  cursor: 'pointer', outline: 'none',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236F6E69' stroke-width='2'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
};

function compactJobBadges(job: IJob): CompactBadge[] {
  const auto = getAutoTags(job);
  const badges: CompactBadge[] = [];
  if (auto.urgency === 'Urgent') badges.push({ key: 'urgent', label: 'Urgent', bg: 'var(--danger-soft)', color: 'var(--danger)' });
  if (auto.roleCategory) {
    const tone = roleBadgeStyle(auto.roleCategory);
    badges.push({ key: 'role', label: auto.roleCategory, bg: tone.bg, color: tone.color });
  }
  if (auto.experienceBand) badges.push({ key: 'exp', label: auto.experienceBand, bg: 'var(--paper-2)', color: 'var(--ink-muted)' });
  if (auto.isEntryLevel) badges.push({ key: 'entry', label: 'Fresher', bg: 'var(--success-soft)', color: 'var(--success)' });
  for (const tech of (auto.techStack || []).slice(0, 2)) {
    badges.push({ key: `tech-${tech}`, label: tech, bg: 'var(--paper-2)', color: 'var(--ink-faint)' });
  }
  return badges.slice(0, 4);
}

export default function Dashboard() {
  const [sp, setSpRaw] = useSearchParams();
  const setSp = useCallback((fn: (sp: URLSearchParams) => void) => {
    setSpRaw(prev => { const next = new URLSearchParams(prev); fn(next); return next; }, { replace: true });
  }, [setSpRaw]);

  // URL-backed state
  const sel = sp.get('company') || '';
  const selectedJobParam = sp.get('selectedJob') || '';
  const [roleCategoryFilter, setRoleCategoryFilter] = useState<string>(sp.get('role') || 'all');
  const [experienceBandFilter, setExperienceBandFilter] = useState<string>(sp.get('exp') || 'all');
  const [workplaceFilter, setWorkplaceFilter] = useState<string>(sp.get('wp') || 'all');
  const [dateFilter, setDateFilter] = useState<string>(sp.get('date') || 'all');
  const [platformFilter, setPlatformFilter] = useState<string>(sp.get('platform') || 'all');
  const [entryLevelFilter, setEntryLevelFilter] = useState<boolean>(sp.get('entry') === '1');
  const [hideApplied, setHideApplied] = useState<boolean>(sp.get('hideApplied') === '1');
  const [showNewOnly, setShowNewOnly] = useState<boolean>(sp.get('newOnly') === '1');
  const [searchInput, setSearchInput] = useState<string>(sp.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(sp.get('q') || '');
  const [sortByMatch, setSortByMatch] = useState<boolean>(sp.get('sort') === 'match');

  // Server-state
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [totalJobs, setTotalJobs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const [cos, setCos] = useState<ICompany[]>([]);
  const [comeBackMap, setComeBackMap] = useState<Record<string, string>>({});

  // UI
  const [jobSheetOpen, setJobSheetOpen] = useState<boolean>(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);

  const { isMobile, useSplit } = useVp();
  const { appliedJobIds, dismissedJobIds, toggleApplied, toggleDismissed, userSkills, currentUser } = useUser();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setSp(p => { if (debouncedSearch) p.set('q', debouncedSearch); else p.delete('q'); p.delete('page'); });
  }, [debouncedSearch, setSp]);

  useEffect(() => { document.title = COPY.site.documentTitleJobs; }, []);

  // Companies dir
  useEffect(() => {
    let cancelled = false;
    fetch('/api/jobs/directory')
      .then(r => r.ok ? r.json() : [])
      .then((d: ICompany[]) => { if (!cancelled) setCos(Array.isArray(d) ? d : []); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // Come-back map
  useEffect(() => {
    if (!currentUser) { setComeBackMap({}); return; }
    let cancelled = false;
    fetch(`/api/users/${encodeURIComponent(currentUser.slug)}/comeback`)
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, string>) => { if (!cancelled) setComeBackMap(d || {}); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [currentUser?.slug]);

  const handleToggleComeBack = useCallback((jobId: string, note?: string) => {
    if (!currentUser) return;
    const slug = currentUser.slug;
    const newNote = note || '';
    setComeBackMap(prev => ({ ...prev, [jobId]: newNote }));
    fetch(`/api/users/${slug}/comeback/${encodeURIComponent(jobId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: newNote }),
    }).catch(() => { });
  }, [currentUser]);

  const handleRemoveComeBack = useCallback((jobId: string) => {
    if (!currentUser) return;
    const slug = currentUser.slug;
    setComeBackMap(prev => { const n = { ...prev }; delete n[jobId]; return n; });
    fetch(`/api/users/${slug}/comeback/${encodeURIComponent(jobId)}`, { method: 'DELETE' }).catch(() => { });
  }, [currentUser]);

  const handleDismiss = useCallback((jobId: string) => {
    toggleDismissed(jobId);
  }, [toggleDismissed]);

  // Fetch jobs (server-side filters)
  const fetchJobs = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else { setLoading(true); setCurrentPage(1); }
    try {
      const p = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      if (sel) p.set('company', sel);
      if (roleCategoryFilter && roleCategoryFilter !== 'all') p.set('roleCategory', roleCategoryFilter);
      if (experienceBandFilter && experienceBandFilter !== 'all') p.set('experienceBand', experienceBandFilter);
      if (entryLevelFilter || experienceBandFilter === 'Fresher (0-1y)') p.set('entryLevel', 'true');
      if (workplaceFilter && workplaceFilter !== 'all') p.set('workplace', workplaceFilter);
      if (platformFilter && platformFilter !== 'all') p.set('platform', platformFilter);
      if (dateFilter && dateFilter !== 'all') p.set('date', dateFilter);
      if (debouncedSearch && debouncedSearch.length >= 2) p.set('search', debouncedSearch);

      const r = await fetch(`/api/jobs?${p}`);
      const d = await r.json() as { jobs?: IJob[]; totalJobs?: number; totalPages?: number; currentPage?: number };
      setTotalJobs(d.totalJobs ?? 0);
      setTotalPages(d.totalPages ?? 1);
      setCurrentPage(d.currentPage ?? pageNum);
      const newJobs = d.jobs ?? [];
      setJobs(prev => append ? [...prev, ...newJobs] : newJobs);
    } catch (e) { console.error(e); }
    finally { if (append) setLoadingMore(false); else setLoading(false); }
  }, [sel, roleCategoryFilter, experienceBandFilter, entryLevelFilter, workplaceFilter, platformFilter, dateFilter, debouncedSearch]);

  useEffect(() => { fetchJobs(1, false); }, [fetchJobs]);

  // Restore selectedJob from URL
  useEffect(() => {
    if (!selectedJobParam) return;
    const found = jobs.find(j => j._id === selectedJobParam);
    if (found) setSelectedJob(found);
    else if (selectedJobParam !== selectedJob?._id) {
      fetch(`/api/jobs/${encodeURIComponent(selectedJobParam)}`)
        .then(r => r.ok ? r.json() : null)
        .then((j: IJob | null) => { if (j) setSelectedJob(j); })
        .catch(() => { });
    }
  }, [selectedJobParam, jobs, selectedJob?._id]);

  // Company domain map
  const companyDomainMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of cos) if (c.companyName && c.domain) m.set(c.companyName, c.domain);
    return m;
  }, [cos]);

  // Client-side filters (hide applied, new only, dismissed)
  const visibleJobs = useMemo(() => {
    const now = Date.now();
    return jobs.filter(j => {
      if (dismissedJobIds.has(j._id)) return false;
      if (hideApplied && appliedJobIds.has(j._id)) return false;
      if (showNewOnly) {
        const d = j.PostedDate || j.scrapedAt;
        if (!d) return false;
        const age = (now - new Date(d).getTime()) / 86400000;
        if (age > 3) return false;
      }
      return true;
    });
  }, [jobs, dismissedJobIds, hideApplied, appliedJobIds, showNewOnly]);

  // Skill match sort
  const skillRe = useMemo(() => buildSkillsRegex(userSkills), [userSkills]);
  const finalJobs = useMemo(() => {
    if (!sortByMatch || !skillRe) return visibleJobs;
    return [...visibleJobs].sort((a, b) => {
      const ha = `${a.JobTitle} ${a.DescriptionPlain || ''} ${(a.autoTags?.techStack || []).join(' ')}`;
      const hb = `${b.JobTitle} ${b.DescriptionPlain || ''} ${(b.autoTags?.techStack || []).join(' ')}`;
      return (hb.match(skillRe) || []).length - (ha.match(skillRe) || []).length;
    });
  }, [visibleJobs, sortByMatch, skillRe]);

  // Auto-select first job on desktop
  useEffect(() => {
    if (!useSplit) return;
    if (!selectedJob && finalJobs.length > 0) {
      setSelectedJob(finalJobs[0]);
      setSp(p => { p.set('selectedJob', finalJobs[0]._id); });
    }
  }, [useSplit, finalJobs, selectedJob, setSp]);

  const handleSelectJob = useCallback((job: IJob) => {
    setSelectedJob(job);
    setSp(p => { p.set('selectedJob', job._id); });
    if (isMobile) setJobSheetOpen(true);
  }, [isMobile, setSp]);

  // New jobs count
  const newJobsCount = useMemo(() => {
    const now = Date.now();
    return jobs.filter(j => {
      const d = j.PostedDate || j.scrapedAt;
      if (!d) return false;
      return (now - new Date(d).getTime()) / 86400000 <= 3;
    }).length;
  }, [jobs]);

  const activeFilters: { label: string; clear: () => void }[] = [
    sel ? { label: sel, clear: () => setSp(p => { p.delete('company'); }) } : null,
    roleCategoryFilter !== 'all' ? { label: roleCategoryFilter, clear: () => { setRoleCategoryFilter('all'); setSp(p => { p.delete('role'); }); } } : null,
    experienceBandFilter !== 'all' ? { label: experienceBandFilter, clear: () => { setExperienceBandFilter('all'); setSp(p => { p.delete('exp'); }); } } : null,
    workplaceFilter !== 'all' ? { label: workplaceFilter, clear: () => { setWorkplaceFilter('all'); setSp(p => { p.delete('wp'); }); } } : null,
    dateFilter !== 'all' ? { label: dateFilter, clear: () => { setDateFilter('all'); setSp(p => { p.delete('date'); }); } } : null,
    platformFilter !== 'all' ? { label: platformFilter, clear: () => { setPlatformFilter('all'); setSp(p => { p.delete('platform'); }); } } : null,
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAllFilters = () => {
    setRoleCategoryFilter('all');
    setExperienceBandFilter('all');
    setWorkplaceFilter('all');
    setDateFilter('all');
    setPlatformFilter('all');
    setEntryLevelFilter(false);
    setHideApplied(false);
    setShowNewOnly(false);
    setSearchInput('');
    setSpRaw({}, { replace: true });
  };

  const hasMore = currentPage < totalPages;
  void cos; void listRef; void relTime;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Container size="xl" style={{ paddingTop: 'clamp(16px, 4vw, 24px)', paddingBottom: isMobile ? 80 : 40, flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
      <PageHeader
        label={COPY.jobs.pageLabel}
        title={COPY.jobs.pageTitle}
        subtitle={loading ? 'Loading…' : `${totalJobs.toLocaleString()} ${COPY.jobs.rolesAvailable}`}
      />

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <DashboardSearchBar
          search={searchInput}
          onSearchChange={setSearchInput}
          sortByMatch={sortByMatch}
          onToggleSortByMatch={() => { const v = !sortByMatch; setSortByMatch(v); setSp(p => { if (v) p.set('sort', 'match'); else p.delete('sort'); }); }}
          hasSkills={userSkills.length > 0}
        />

        {isMobile ? (
          <DashboardMobileFilters
            hideApplied={hideApplied}
            entryLevelFilter={entryLevelFilter}
            showNewOnly={showNewOnly}
            newJobsCount={newJobsCount}
            setHideApplied={setHideApplied}
            setEntryLevelFilter={setEntryLevelFilter}
            setShowNewOnly={setShowNewOnly}
            setSp={setSp}
            activeMobileFilters={activeFilters.length}
            onOpenFilters={() => setFilterSheetOpen(true)}
          />
        ) : (
          <DashboardFilterBar
            roleCategoryFilter={roleCategoryFilter}
            experienceBandFilter={experienceBandFilter}
            workplaceFilter={workplaceFilter}
            dateFilter={dateFilter}
            platformFilter={platformFilter}
            sel={sel} cos="" roleOptions={ROLE_OPTIONS} experienceOptions={EXPERIENCE_OPTIONS}
            desktopSelectStyle={desktopSelectStyle}
            setRoleCategoryFilter={setRoleCategoryFilter}
            setExperienceBandFilter={setExperienceBandFilter}
            setWorkplaceFilter={setWorkplaceFilter}
            setDateFilter={setDateFilter}
            setPlatformFilter={setPlatformFilter}
            setSel={() => { }} setCos={() => { }}
            setSp={setSp}
          />
        )}

        {/* Active chips */}
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {activeFilters.map((f, i) => (
              <span key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 6px 4px 11px', borderRadius: 999,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                fontSize: '0.78rem', fontWeight: 500,
              }}>
                {f.label}
                <button onClick={f.clear} style={{
                  width: 16, height: 16, borderRadius: 999,
                  border: 'none', background: 'rgba(0,0,0,0.08)', cursor: 'pointer',
                  color: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0,
                }}>×</button>
              </span>
            ))}
            <button onClick={clearAllFilters} style={{
              fontSize: '0.78rem', color: 'var(--ink-muted)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '4px 8px', textDecoration: 'underline',
            }}>Clear all</button>
          </div>
        )}
      </div>

      {/* Body */}
      {loading && jobs.length === 0 ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 11 }} />)}
        </div>
      ) : finalJobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={28} />}
          title={COPY.jobs.noJobsTitle}
          body={entryLevelFilter ? COPY.jobs.noEntryJobsBody : COPY.jobs.noJobsBody}
          action={
            activeFilters.length > 0 ? (
              <Button variant="primary" size="md" onClick={clearAllFilters}>{COPY.jobs.clearFilters}</Button>
            ) : null
          }
        />
      ) : useSplit ? (
        /* ── Desktop split ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 380px) 1fr',
          gap: 16,
          flex: 1,
          minHeight: 0,
          height: 'calc(100vh - 280px)',
          minHeight2: 540,
        } as any}>
          {/* List */}
          <div
            ref={listRef}
            className="thin-scroll"
            style={{
              overflowY: 'auto',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
            }}
          >
            {finalJobs.map(j => {
              const auto = getAutoTags(j);
              const matched = skillRe ? Array.from(new Set((`${j.JobTitle} ${j.DescriptionPlain || ''} ${(auto.techStack || []).join(' ')}`).match(skillRe) || [])).length : 0;
              const matchPct = userSkills.length > 0 ? Math.round((matched / userSkills.length) * 100) : 0;
              const rt = relTime(j.PostedDate || j.scrapedAt || null);
              const isNew = rt === 'Today' || rt === '1d ago';
              return (
                <JobListItem
                  key={j._id}
                  job={j}
                  domain={companyDomainMap.get(j.Company)}
                  isSelected={selectedJob?._id === j._id}
                  isApplied={appliedJobIds.has(j._id)}
                  isComeBack={!!comeBackMap[j._id]}
                  comeBackNote={comeBackMap[j._id] || ''}
                  isNew={isNew}
                  relativeTime={isNew ? null : rt}
                  visibleBadges={compactJobBadges(j)}
                  showSkillMatch={matched > 0}
                  skillMatchText={`${matchPct}% match`}
                  skillMatchBg="var(--accent-soft)"
                  skillMatchColor="var(--accent)"
                  onSelect={handleSelectJob}
                  onDismiss={handleDismiss}
                />
              );
            })}

            {hasMore && (
              <div style={{ padding: 12, display: 'flex', justifyContent: 'center' }}>
                <Button variant="ghost" size="sm" loading={loadingMore} onClick={() => fetchJobs(currentPage + 1, true)}>
                  Load more
                </Button>
              </div>
            )}
          </div>

          {/* Detail */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            minHeight: 0,
          }}>
            {selectedJob ? (
              <JobDetailPanel
                job={selectedJob}
                domain={companyDomainMap.get(selectedJob.Company)}
                appliedJobIds={appliedJobIds}
                comeBackMap={comeBackMap}
                onToggleApplied={toggleApplied}
                onToggleComeBack={handleToggleComeBack}
                onRemoveComeBack={handleRemoveComeBack}
                onSelectJob={handleSelectJob}
              />
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>
                <Briefcase size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p style={{ fontSize: '0.92rem' }}>Select a job to see details.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Mobile list ── */
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {finalJobs.map(j => {
            const auto = getAutoTags(j);
            const matched = skillRe ? Array.from(new Set((`${j.JobTitle} ${j.DescriptionPlain || ''} ${(auto.techStack || []).join(' ')}`).match(skillRe) || [])).length : 0;
            const matchPct = userSkills.length > 0 ? Math.round((matched / userSkills.length) * 100) : 0;
            const rt = relTime(j.PostedDate || j.scrapedAt || null);
            const isNew = rt === 'Today' || rt === '1d ago';
            return (
              <JobListItem
                key={j._id}
                job={j}
                domain={companyDomainMap.get(j.Company)}
                isSelected={false}
                isApplied={appliedJobIds.has(j._id)}
                isComeBack={!!comeBackMap[j._id]}
                comeBackNote={comeBackMap[j._id] || ''}
                isNew={isNew}
                relativeTime={isNew ? null : rt}
                visibleBadges={compactJobBadges(j)}
                showSkillMatch={matched > 0}
                skillMatchText={`${matchPct}%`}
                skillMatchBg="var(--accent-soft)"
                skillMatchColor="var(--accent)"
                onSelect={handleSelectJob}
                onDismiss={handleDismiss}
              />
            );
          })}
          {hasMore && (
            <div style={{ padding: 14, display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border)' }}>
              <Button variant="ghost" size="sm" loading={loadingMore} onClick={() => fetchJobs(currentPage + 1, true)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Mobile sheets */}
      {isMobile && (
        <>
          <DashboardJobSheet
            job={selectedJob}
            isOpen={jobSheetOpen}
            onClose={() => setJobSheetOpen(false)}
            domain={selectedJob ? companyDomainMap.get(selectedJob.Company) : undefined}
            appliedJobIds={appliedJobIds}
            comeBackMap={comeBackMap}
            onToggleApplied={toggleApplied}
            onToggleComeBack={handleToggleComeBack}
            onRemoveComeBack={handleRemoveComeBack}
            onSelectJob={handleSelectJob}
          />
          <DashboardFilterSheet
            isOpen={filterSheetOpen}
            onClose={() => setFilterSheetOpen(false)}
            activeFilterCount={activeFilters.length}
            visibleJobsCount={finalJobs.length}
            clearAllFilters={clearAllFilters}
            roleCategoryFilter={roleCategoryFilter}
            experienceBandFilter={experienceBandFilter}
            workplaceFilter={workplaceFilter}
            dateFilter={dateFilter}
            platformFilter={platformFilter}
            roleOptions={ROLE_OPTIONS}
            experienceOptions={EXPERIENCE_OPTIONS}
            setRoleCategoryFilter={setRoleCategoryFilter}
            setExperienceBandFilter={setExperienceBandFilter}
            setWorkplaceFilter={setWorkplaceFilter}
            setDateFilter={setDateFilter}
            setPlatformFilter={setPlatformFilter}
            setSp={setSp}
          />
        </>
      )}
    </Container>
  );
}
