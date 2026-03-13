// FILE: src/pages/Dashboard.tsx
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, X, MapPin, Building2, Clock, ExternalLink, ArrowLeft, Search, CheckCircle2, Eye, EyeOff, Sparkles, GraduationCap } from 'lucide-react';
import { useUser } from '../context/UserContext';
import type { IJob, IJobAutoTags } from '../types';
import { Container, PageHeader, Button, Badge, EmptyState } from '../components/ui';
import { COPY } from '../theme/brand';

const PAGE_SIZE = 30;

/** Strip HTML tags for plain-text skill matching */
function stripHtmlText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

/**
 * Build a combined regex for all skills, sorted longest-first so multi-word
 * skills ("React Native") are matched before their sub-parts ("React").
 * Returns null when skills is empty.
 */
function buildSkillsRegex(skills: string[]): RegExp | null {
  if (!skills.length) return null;
  const sorted = [...skills].sort((a, b) => b.length - a.length);
  const patterns = sorted.map(skill => {
    const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const start = /\w/.test(skill[0]) ? '\\b' : '';
    const end = /\w/.test(skill[skill.length - 1]) ? '\\b' : '';
    return `${start}${esc}${end}`;
  });
  return new RegExp(patterns.join('|'), 'gi');
}

function useViewportInfo() {
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { width, height } = viewport;
  const isXsSm = width < 640;
  const isMd = width >= 640 && width < 768;
  const isLg = width >= 768 && width < 1024;
  const isXl2xl = width >= 1024 && width < 1536;
  const is3xl = width >= 1536;
  const isShortLandscape = width > height && height < 500;
  const useSplitView = width >= 768 && height >= 500;

  return { width, height, isXsSm, isMd, isLg, isXl2xl, is3xl, isShortLandscape, useSplitView };
}

interface CS { companyName: string; openRoles: number; }

const ROLE_FILTER_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Frontend', value: 'Frontend' },
  { label: 'Backend', value: 'Backend' },
  { label: 'Full Stack', value: 'Full Stack' },
  { label: 'DevOps', value: 'DevOps/SRE' },
  { label: 'Data', value: 'Data' },
  { label: 'ML/AI', value: 'ML/AI' },
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

const DEFAULT_AUTO_TAGS: IJobAutoTags = {
  techStack: [],
  roleCategory: 'Other',
  experienceBand: null,
  isEntryLevel: false,
  domain: [],
  urgency: null,
  education: null,
};

function getAutoTags(job: IJob): IJobAutoTags {
  return {
    ...DEFAULT_AUTO_TAGS,
    ...(job.autoTags ?? {}),
    techStack: Array.isArray(job.autoTags?.techStack) ? job.autoTags!.techStack : [],
    domain: Array.isArray(job.autoTags?.domain) ? job.autoTags!.domain : [],
    isEntryLevel: job.autoTags?.isEntryLevel ?? job.isEntryLevel ?? false,
  };
}

function roleBadgeStyle(roleCategory: string | null) {
  switch (roleCategory) {
    case 'Frontend':
      return { bg: '#dbeafe', color: '#1e40af' };
    case 'Backend':
      return { bg: '#ede9fe', color: '#5b21b6' };
    case 'Full Stack':
      return { bg: '#e0e7ff', color: '#3730a3' };
    case 'DevOps/SRE':
      return { bg: '#ffedd5', color: '#9a3412' };
    case 'Data':
      return { bg: '#ccfbf1', color: '#115e59' };
    case 'ML/AI':
      return { bg: '#fce7f3', color: '#9d174d' };
    case 'QA':
      return { bg: '#f3f4f6', color: '#374151' };
    case 'Mobile':
      return { bg: '#dcfce7', color: '#166534' };
    default:
      return { bg: 'var(--paper2)', color: 'var(--muted-ink)' };
  }
}

function compactJobBadges(job: IJob) {
  const autoTags = getAutoTags(job);
  const badges: Array<{ key: string; label: string; bg: string; color: string }> = [];
  if (autoTags.urgency === 'Urgent') {
    badges.push({ key: 'urgent', label: 'Urgent', bg: '#fee2e2', color: '#b91c1c' });
  }
  if (autoTags.roleCategory) {
    const tone = roleBadgeStyle(autoTags.roleCategory);
    badges.push({ key: 'role', label: autoTags.roleCategory, bg: tone.bg, color: tone.color });
  }
  if (autoTags.experienceBand) {
    badges.push({ key: 'exp', label: autoTags.experienceBand, bg: 'var(--paper2)', color: 'var(--muted-ink)' });
  }
  if (autoTags.isEntryLevel) {
    badges.push({ key: 'entry', label: 'Fresher Friendly', bg: '#dcfce7', color: '#166534' });
  }
  for (const tech of autoTags.techStack.slice(0, 2)) {
    badges.push({ key: `tech-${tech}`, label: tech, bg: 'var(--paper2)', color: 'var(--subtle-ink)' });
  }
  return badges.slice(0, 5);
}

function inferWorkplace(job: IJob): 'remote' | 'hybrid' | 'on-site' | null {
  const text = `${job.WorkplaceType || ''} ${job.Location || ''} ${job.JobTitle || ''}`.toLowerCase();
  if (text.includes('remote')) return 'remote';
  if (text.includes('hybrid')) return 'hybrid';
  if (text.includes('on-site') || text.includes('onsite') || text.includes('on site')) return 'on-site';
  return null;
}

function logoDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'example.com';
  }
}

function relTime(d: string | null) {
  if (!d) return null;
  const posted = new Date(d);
  if (isNaN(posted.getTime())) return null;
  const diff = Math.floor((Date.now() - posted.getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

type CompactBadge = { key: string; label: string; bg: string; color: string };

interface JobListItemProps {
  job: IJob;
  isSelected: boolean;
  isApplied: boolean;
  isComeBack: boolean;
  comeBackNote: string;
  isNew: boolean;
  relativeTime: string | null;
  visibleBadges: CompactBadge[];
  showSkillMatch: boolean;
  skillMatchText: string;
  skillMatchBg: string;
  skillMatchColor: string;
  onSelect: (job: IJob) => void;
}

const JobListItem = memo(function JobListItem({
  job,
  isSelected,
  isApplied,
  isComeBack,
  comeBackNote,
  isNew,
  relativeTime,
  visibleBadges,
  showSkillMatch,
  skillMatchText,
  skillMatchBg,
  skillMatchColor,
  onSelect,
}: JobListItemProps) {
  const [logoError, setLogoError] = useState(false);
  return (
    <div
      onClick={() => onSelect(job)}
      style={{
        minHeight: 80,
        padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
        background: isSelected ? 'var(--primary-soft)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
        transition: 'all 0.18s',
        opacity: isApplied ? 0.55 : 1,
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--paper2)'; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, flexShrink: 0, background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 4 }}>
          {logoError ? (
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              {(job.Company || '?').charAt(0)}
            </span>
          ) : (
            <img
              src={`https://logo.clearbit.com/${logoDomainFromUrl(job.ApplicationURL)}`}
              alt={job.Company}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={() => setLogoError(true)}
            />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.3, display: 'flex', alignItems: 'flex-start', gap: 5 }}>
            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{job.JobTitle}</span>
            {isApplied && <CheckCircle2 size={14} style={{ flexShrink: 0, color: '#16a34a', marginTop: 2 }} />}
            {!isApplied && isComeBack && <Clock size={14} style={{ flexShrink: 0, color: '#d97706', marginTop: 2 }} />}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, fontSize: '0.78rem', color: 'var(--muted-ink)' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.Company}</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.Location}</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {isNew && <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999, background: '#FF6B6B', color: '#fff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>NEW</span>}
        {relativeTime && <Badge variant="acid" style={{ fontSize: '0.62rem' }}><Clock size={8} />{relativeTime}</Badge>}
        {visibleBadges.map(badge => (
          <span key={badge.key} style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999, background: badge.bg, color: badge.color, fontWeight: 600 }}>
            {badge.label}
          </span>
        ))}
        {showSkillMatch && (
          <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: 999, background: skillMatchBg, color: skillMatchColor, fontWeight: 600 }}>
            {skillMatchText}
          </span>
        )}
      </div>
      {isComeBack && comeBackNote && (
        <div style={{ fontSize: '0.72rem', color: '#92400e', fontStyle: 'italic', marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85 }}>
          {comeBackNote.length > 45 ? comeBackNote.slice(0, 45) + '\u2026' : comeBackNote}
        </div>
      )}
    </div>
  );
});

export default function Dashboard() {
  const [sp, setSp] = useSearchParams();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [cos, setCos] = useState<CS[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [workplaceFilter, setWorkplaceFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [hideApplied, setHideApplied] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [entryLevelFilter, setEntryLevelFilter] = useState(false);
  const [roleCategoryFilter, setRoleCategoryFilter] = useState<string | null>(null);
  const [experienceBandFilter, setExperienceBandFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'match'>('default');
  const [comeBackMap, setComeBackMap] = useState<Map<string, { note: string; addedAt: string }>>(new Map());
  const [showComeBackOnly, setShowComeBackOnly] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const visibleJobsRef = useRef<IJob[]>([]);
  const savedListScrollTopRef = useRef<number | null>(null);
  const initializedSelectionRef = useRef(false);
  const viewport = useViewportInfo();
  const { isXsSm, isMd, isLg, is3xl, isShortLandscape, useSplitView } = viewport;
  const useBottomSheet = !useSplitView;
  const { currentUser, userSkills, appliedJobIds, previousVisitAt, toggleApplied } = useUser();

  // Fetch comeBackTo jobs for current user
  useEffect(() => {
    if (!currentUser) { setComeBackMap(new Map()); return; }
    let cancelled = false;
    fetch(`/api/users/${encodeURIComponent(currentUser.slug)}/comeback`)
      .then(r => r.ok ? r.json() : [])
      .then((entries: { jobId: string; note: string; addedAt: string }[]) => {
        if (!cancelled) {
          setComeBackMap(new Map(entries.map(e => [e.jobId, { note: e.note, addedAt: e.addedAt }])));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [currentUser?.slug]);

  const toggleComeBack = useCallback((jobId: string, note: string) => {
    if (!currentUser) return;
    const slug = encodeURIComponent(currentUser.slug);
    const id = encodeURIComponent(jobId);
    setComeBackMap(prev => {
      const next = new Map(prev);
      next.set(jobId, { note, addedAt: new Date().toISOString() });
      return next;
    });
    fetch(`/api/users/${slug}/comeback/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    }).then(r => r.ok ? r.json() : null)
      .then((entries: { jobId: string; note: string; addedAt: string }[] | null) => {
        if (entries) setComeBackMap(new Map(entries.map(e => [e.jobId, { note: e.note, addedAt: e.addedAt }])));
      })
      .catch(() => {});
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
      })
      .catch(() => {});
  }, [currentUser]);

  const handleToggleApplied = useCallback(async (jobId: string) => {
    const wasApplied = appliedJobIds.has(jobId);
    await toggleApplied(jobId);
    if (!wasApplied && comeBackMap.has(jobId)) {
      removeComeBack(jobId);
    }
  }, [appliedJobIds, toggleApplied, comeBackMap, removeComeBack]);

  // Lock body scroll when mobile detail sheet is open
  useEffect(() => {
    if (mobileSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSheetOpen]);

  useEffect(() => {
    if (!useBottomSheet) setMobileSheetOpen(false);
    if (!isMd) setFilterModalOpen(false);
  }, [useBottomSheet, isMd]);
  useEffect(() => { document.title = COPY.site.documentTitleJobs; }, []);
  const sel = sp.get('company') || '';
  const selectedJobParam = sp.get('selectedJob') || '';

  const fetchJobs = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      if (sel) params.set('company', sel);
      const jr = await fetch(`/api/jobs?${params}`);
      const jd = await jr.json() as { jobs?: IJob[]; totalJobs?: number; totalPages?: number };
      const newJobs = jd.jobs ?? [];
      setTotalJobs(jd.totalJobs ?? 0);
      setJobs(prev => append ? [...prev, ...newJobs] : newJobs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [sel]);

  useEffect(() => {
    fetchJobs(1, false);
  }, [fetchJobs]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/jobs/directory')
      .then(r => r.ok ? r.json() : [])
      .then((data: CS[]) => { if (!cancelled) setCos(Array.isArray(data) ? data : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const newJobsCount = useMemo(() => {
    if (!currentUser || !previousVisitAt) return 0;
    const prev = new Date(previousVisitAt).getTime();
    if (Number.isNaN(prev)) return 0;
    return jobs.filter(job => {
      const d = new Date((job.PostedDate || job.scrapedAt || '') as string).getTime();
      return !Number.isNaN(d) && d > prev && !appliedJobIds.has(job._id);
    }).length;
  }, [jobs, currentUser, previousVisitAt, appliedJobIds]);

  const visibleJobs = useMemo(() => {
    const now = Date.now();
    const filtered = jobs.filter(job => {
      const autoTags = getAutoTags(job);
      if (workplaceFilter && inferWorkplace(job) !== workplaceFilter) return false;
      if (platformFilter && String(job.ATSPlatform || job.sourceSite || '').toLowerCase() !== platformFilter) return false;
      if (dateFilter) {
        const postedAt = new Date((job.PostedDate || job.scrapedAt || '') as string).getTime();
        if (!Number.isNaN(postedAt)) {
          const diffDays = Math.floor((now - postedAt) / 86400000);
          if (dateFilter === '1d' && diffDays > 1) return false;
          if (dateFilter === '3d' && diffDays > 3) return false;
          if (dateFilter === '7d' && diffDays > 7) return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${job.JobTitle || ''} ${job.Company || ''} ${job.Location || ''} ${job.DescriptionPlain || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (hideApplied && appliedJobIds.has(job._id)) return false;
      if (entryLevelFilter && !autoTags.isEntryLevel) return false;
      if (roleCategoryFilter && autoTags.roleCategory !== roleCategoryFilter) return false;
      if (experienceBandFilter && autoTags.experienceBand !== experienceBandFilter) return false;
      if (showComeBackOnly && !comeBackMap.has(job._id)) return false;
      if (showNewOnly) {
        if (!previousVisitAt) return false;
        const prev = new Date(previousVisitAt).getTime();
        const postedAt = new Date((job.PostedDate || job.scrapedAt || '') as string).getTime();
        if (Number.isNaN(prev) || Number.isNaN(postedAt) || postedAt <= prev || appliedJobIds.has(job._id)) return false;
      }
      return true;
    });

    if (sortBy !== 'match' || !userSkills.length) return filtered;

    return [...filtered].sort((a, b) => {
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
  }, [jobs, workplaceFilter, platformFilter, dateFilter, searchQuery, hideApplied, entryLevelFilter, roleCategoryFilter, experienceBandFilter, showComeBackOnly, showNewOnly, previousVisitAt, appliedJobIds, comeBackMap, sortBy, userSkills]);

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
    if (selectedJobParam || useBottomSheet) return;
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

  const clearAllFilters = () => { setSp({}); setWorkplaceFilter(null); setPlatformFilter(null); setDateFilter(null); setSearchQuery(''); setHideApplied(false); setShowNewOnly(false); setEntryLevelFilter(false); setRoleCategoryFilter(null); setExperienceBandFilter(null); setSortBy('default'); setShowComeBackOnly(false); };

  const logoDomain = (url: string) => { try { return new URL(url).hostname.replace('www.', ''); } catch { return 'example.com'; } };

  const workplaceBadge = (job: IJob): { label: string; bg: string; color: string } | null => {
    const wp = inferWorkplace(job);
    if (wp === 'remote') return { label: 'Remote', bg: '#d1fae5', color: '#065f46' };
    if (wp === 'hybrid') return { label: 'Hybrid', bg: '#fef3c7', color: '#92400e' };
    if (wp === 'on-site') return { label: 'On-site', bg: '#dbeafe', color: '#1e40af' };
    return null;
  };

  const salaryDisplay = (job: IJob): string | null => {
    if (job.SalaryInfo) return job.SalaryInfo;
    if (job.SalaryMin && job.SalaryMax) {
      const fmt = (n: number) => (job.SalaryCurrency === 'INR' || !job.SalaryCurrency) && n >= 100000 ? `${(n / 100000).toFixed(1)}L` : `${(n / 1000).toFixed(0)}K`;
      const curr = job.SalaryCurrency === 'INR' ? 'Rs ' : job.SalaryCurrency === 'USD' ? '$' : (job.SalaryCurrency ? job.SalaryCurrency + ' ' : '');
      return `${curr}${fmt(job.SalaryMin)} - ${curr}${fmt(job.SalaryMax)}`;
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

  const handleSelectJob = useCallback((job: IJob) => {
    if (listRef.current) {
      savedListScrollTopRef.current = listRef.current.scrollTop;
    }
    const next = new URLSearchParams(window.location.search);
    next.set('selectedJob', job._id);
    setSp(next);
    setSelectedJob(job);
    if (useBottomSheet) setMobileSheetOpen(true);
  }, [setSp, useBottomSheet]);

  /* Right-panel detail view */
  const DetailPanel = ({ job, mobileMode = false }: { job: IJob; mobileMode?: boolean }) => {
    const descRef = useRef<HTMLDivElement>(null);
    const { userSkills: skills } = useUser();
    const [cbExpanded, setCbExpanded] = useState(false);
    const [cbNote, setCbNote] = useState('');

    const matchResult = useMemo(() => {
      if (!skills.length) return null;
      const text = stripHtmlText(job.DescriptionCleaned || job.Description || '');
      const matched: string[] = [];
      const unmatched: string[] = [];
      for (const skill of skills) {
        const re = buildSkillsRegex([skill]);
        if (re && re.test(text)) matched.push(skill);
        else unmatched.push(skill);
      }
      return { matched, unmatched, total: skills.length };
    }, [job, skills]);

    const colorInfo = matchResult ? (
      matchResult.matched.length === 0 ? { color: 'var(--muted-ink)', label: '' } :
      matchResult.matched.length <= 2 ? { color: '#92400e' , label: '' } :
      matchResult.matched.length <= 4 ? { color: '#166534', label: '' } :
      { color: '#14532d', label: 'Strong match' }
    ) : null;


    useEffect(() => {
      const container = descRef.current;
      if (!container) return;

      const boilerplate = container.querySelector('.jd-boilerplate-sections, .jd-secondary-sections') as HTMLElement | null;
      if (!boilerplate) return;

      boilerplate.style.display = 'none';

      const existingToggle = container.querySelector('.jd-boilerplate-toggle');
      if (existingToggle) existingToggle.remove();

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'jd-boilerplate-toggle';
      button.textContent = 'Show company info & other details ▾';

      const handleToggle = () => {
        const isHidden = boilerplate.style.display === 'none';
        boilerplate.style.display = isHidden ? 'block' : 'none';
        button.textContent = isHidden ? 'Hide company info ▴' : 'Show company info & other details ▾';
      };

      button.addEventListener('click', handleToggle);
      boilerplate.parentNode?.insertBefore(button, boilerplate);

      return () => {
        button.removeEventListener('click', handleToggle);
        button.remove();
        boilerplate.style.display = '';
      };
    }, [job._id, job.DescriptionCleaned, job.Description]);

    // Skill highlighting: walk text nodes, wrap matches in <mark class="skill-match">
    useEffect(() => {
      const container = descRef.current;
      if (!container || !skills.length) return;

      // Remove any highlights from a previous run (skills changed, same job)
      container.querySelectorAll('mark.skill-match').forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        }
      });
      container.normalize();

      const re = buildSkillsRegex(skills);
      if (!re) return;

      function highlightNode(node: Node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent || '';
          if (!text.trim()) return;
          re!.lastIndex = 0;
          if (!re!.test(text)) return;
          re!.lastIndex = 0;
          const span = document.createElement('span');
          span.innerHTML = text.replace(re!, m => `<mark class="skill-match">${m}</mark>`);
          node.parentNode?.replaceChild(span, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as Element).tagName?.toLowerCase();
          if (tag === 'mark' || tag === 'script' || tag === 'style') return;
          Array.from(node.childNodes).forEach(highlightNode);
        }
      }
      highlightNode(container);
    }, [job._id, skills]);

    const effectiveDate = job.PostedDate || job.scrapedAt || null;
    const wb = workplaceBadge(job);
    const sal = salaryDisplay(job);
    const autoTags = getAutoTags(job);
    const roleTone = roleBadgeStyle(autoTags.roleCategory);
    return (
      <div>
        {/* Header row */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 48, height: 48, flexShrink: 0, background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 6 }}>
            <LogoImg job={job} size={48} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: mobileMode ? '1.2rem' : '1.4rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25, letterSpacing: '-0.02em' }}>{job.JobTitle}</h2>
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
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}>Type: {job.ContractType}</span>
              )}
              {job.Department && job.Department !== 'N/A' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', color: 'var(--muted-ink)' }}>Dept: {job.Department}</span>
              )}
            </div>
          </div>
        </div>

        {/* Badge row */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {wb && <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: wb.bg, color: wb.color, fontWeight: 600 }}>{wb.label}</span>}
          {sal && <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>Pay {sal}</span>}
          {job.Office && <Badge variant="neutral">Office {job.Office}</Badge>}
          {job.Team && job.Team !== job.Department && <Badge variant="neutral">Team {job.Team}</Badge>}
        </div>

        {/* Job details */}
        <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 14, background: 'var(--paper2)', border: '1px solid var(--border)' }}>
          <div className="font-sketch" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Job Details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Role</span>
              <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: roleTone.bg, color: roleTone.color, fontWeight: 600 }}>{autoTags.roleCategory || 'Other'}</span>
            </div>
            {autoTags.experienceBand && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Experience</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: 'var(--surface-solid)', color: 'var(--ink)', fontWeight: 600 }}>{autoTags.experienceBand}</span>
              </div>
            )}
            {autoTags.domain.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Domain</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {autoTags.domain.map(domain => <span key={domain} style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: 'var(--surface-solid)', color: 'var(--ink)', fontWeight: 600 }}>{domain}</span>)}
                </div>
              </div>
            )}
            {autoTags.education && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Education</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: 'var(--surface-solid)', color: 'var(--ink)', fontWeight: 600 }}>{autoTags.education}</span>
              </div>
            )}
            {autoTags.urgency && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86 }}>Urgency</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>{autoTags.urgency}</span>
              </div>
            )}
            {autoTags.techStack.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', minWidth: 86, paddingTop: 4 }}>Tech Stack</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                  {autoTags.techStack.map(tech => <span key={tech} style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: 999, background: 'var(--surface-solid)', color: 'var(--subtle-ink)', fontWeight: 600 }}>{tech}</span>)}
                </div>
              </div>
            )}
          </div>
          {autoTags.isEntryLevel && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: '#dcfce7', color: '#166534', fontSize: '0.84rem', fontWeight: 600 }}>
              Fresher Friendly: This role appears suitable for freshers and entry-level candidates.
            </div>
          )}
        </div>

        {/* AllLocations */}
        {Array.isArray(job.AllLocations) && job.AllLocations.length > 1 && (
          <div style={{ fontSize: 12, color: 'var(--muted-ink)', marginTop: 8 }}>
            Also: {job.AllLocations.join(' | ')}
          </div>
        )}

        {/* Timestamps */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.78rem', color: 'var(--muted-ink)' }}>
          <span><Clock size={12} style={{ verticalAlign: -2, marginRight: 4 }} />{effectiveDate ? `${COPY.jobs.postedPrefix} ${new Date(effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : COPY.jobs.postedNA}</span>
          {job.scrapedAt && <span>Scraped: {relTime(job.scrapedAt) ?? 'N/A'}</span>}
        </div>

        {!autoTags.techStack.length && Array.isArray(job.Tags) && job.Tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {job.Tags.map(tag => (
              <span key={tag} style={{ background: 'var(--paper2)', borderRadius: 999, padding: '2px 10px', fontSize: 12, color: 'var(--muted-ink)' }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Apply buttons */}
        {!mobileMode && (
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <a href={job.DirectApplyURL || job.ApplicationURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1 }}>
              <Button size="lg" style={{ width: '100%' }}>{COPY.jobs.applyNow} <ExternalLink size={14} /></Button>
            </a>
            {currentUser && (() => {
              const applied = appliedJobIds.has(job._id);
              return (
                <button
                  onClick={() => handleToggleApplied(job._id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                    fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
                    transition: 'all 0.18s', flexShrink: 0,
                    background: applied ? 'var(--primary)' : 'transparent',
                    color: applied ? '#fff' : 'var(--primary)',
                    border: applied ? '1.5px solid var(--primary)' : '1.5px solid var(--primary)',
                  }}
                >
                  <CheckCircle2 size={15} />
                  {applied ? 'Applied' : 'Mark Applied'}
                </button>
              );
            })()}
          </div>
        )}

        {/* Come Back Later inline feature */}
        {currentUser && (() => {
          const isCB = comeBackMap.has(job._id);
          const cbEntry = comeBackMap.get(job._id);
          return (
            <div style={{ marginTop: 10 }}>
              {!cbExpanded && (
                <button
                  onClick={() => { setCbNote(cbEntry?.note ?? ''); setCbExpanded(true); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                    fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
                    transition: 'all 0.18s',
                    background: isCB ? '#fef3c7' : 'transparent',
                    color: isCB ? '#92400e' : 'var(--muted-ink)',
                    border: isCB ? '1.5px solid #fcd34d' : '1.5px solid var(--border)',
                  }}
                >
                  <Clock size={14} style={{ color: isCB ? '#d97706' : 'var(--muted-ink)', flexShrink: 0 }} />
                  {isCB ? 'Coming Back' : 'Come Back Later'}
                  {isCB && cbEntry?.note && (
                    <span style={{ fontWeight: 400, fontSize: '0.78rem', color: '#92400e', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      &middot; {cbEntry.note}
                    </span>
                  )}
                </button>
              )}
              {cbExpanded && (
                <div style={{ padding: '12px 14px', borderRadius: 10, border: '1.5px solid #fcd34d', background: '#fffbeb' }}>
                  <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600, marginBottom: 8 }}>
                    {isCB ? 'Edit your note' : 'Why are you waiting?'}{' '}
                    <span style={{ fontWeight: 400, color: '#b45309' }}>(optional)</span>
                  </div>
                  <textarea
                    value={cbNote}
                    onChange={e => setCbNote(e.target.value.slice(0, 200))}
                    placeholder="e.g. Waiting for next funding round, need more experience\u2026"
                    rows={2}
                    style={{
                      width: '100%', borderRadius: 8, border: '1px solid #fcd34d',
                      background: '#fff', padding: '8px 10px', fontSize: '0.85rem',
                      fontFamily: 'inherit', resize: 'none', outline: 'none',
                      color: '#92400e', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: 3, marginBottom: 10 }}>
                    {cbNote.length}/200
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { toggleComeBack(job._id, cbNote.trim()); setCbExpanded(false); }}
                      style={{
                        padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit',
                        background: '#d97706', color: '#fff', border: 'none', transition: 'all 0.18s',
                      }}
                    >
                      {isCB ? 'Save changes' : 'Flag it'}
                    </button>
                    {isCB && (
                      <button
                        onClick={() => { removeComeBack(job._id); setCbExpanded(false); }}
                        style={{
                          padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                          fontSize: '0.85rem', fontWeight: 400, fontFamily: 'inherit',
                          background: 'transparent', color: '#92400e',
                          border: '1px solid #fcd34d', transition: 'all 0.18s',
                        }}
                      >
                        Remove flag
                      </button>
                    )}
                    <button
                      onClick={() => setCbExpanded(false)}
                      style={{
                        padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 400, fontFamily: 'inherit',
                        background: 'transparent', color: 'var(--muted-ink)',
                        border: '1px solid var(--border)', transition: 'all 0.18s', marginLeft: 'auto',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

        {/* Skills match indicator */}
        {matchResult && (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--paper2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: matchResult.matched.length + matchResult.unmatched.length > 0 ? 8 : 0 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: colorInfo!.color }}>
                Skills match: {matchResult.matched.length} of {matchResult.total}
              </span>
              {colorInfo!.label && (
                <span style={{ background: '#bbf7d0', color: '#14532d', borderRadius: 999, padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {colorInfo!.label}
                </span>
              )}
            </div>
            {(matchResult.matched.length > 0 || matchResult.unmatched.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {matchResult.matched.map(s => (
                  <span key={s} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 999, background: '#dcfce7', color: '#166534', fontWeight: 600 }}>{s}</span>
                ))}
                {matchResult.unmatched.map(s => (
                  <span key={s} style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 999, background: 'var(--paper)', color: 'var(--muted-ink)', border: '1px solid var(--border)' }}>{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <p className="font-sketch" style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary)', marginTop: 24, marginBottom: 12 }}>About This Role</p>
        <div
          ref={descRef}
          className="job-description-html jd-content"
          style={{ fontSize: is3xl ? 15 : 14, lineHeight: 1.7, color: 'var(--muted-ink)', padding: '12px 0', maxWidth: is3xl ? 800 : 720 }}
          dangerouslySetInnerHTML={{ __html: job.DescriptionCleaned || job.Description || 'No description provided.' }}
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

  const SheetActions = ({ job }: { job: IJob }) => {
    const applied = appliedJobIds.has(job._id);
    return (
      <div style={{
        position: 'sticky',
        bottom: 0,
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--border)',
        background: 'var(--surface-solid)',
        display: 'flex',
        gap: 10,
        zIndex: 2,
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
      `}</style>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '16px 0' }}>
        <Container style={is3xl ? { maxWidth: 1600 } : undefined}>
          <PageHeader label={COPY.jobs.pageLabel} title={sel || COPY.jobs.pageTitle}
            subtitle={visibleJobs.length === totalJobs ? `${totalJobs} ${COPY.jobs.rolesAvailable}` : `${visibleJobs.length} of ${totalJobs} ${COPY.jobs.rolesAvailable}`}
            actions={sel ? <button onClick={clearAllFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1.25px solid var(--border)', background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>{sel}<X size={11} /></button> : undefined} />
        </Container>
      </div>
      <Container style={{ padding: isXsSm ? '20px 16px' : '28px 24px', maxWidth: is3xl ? 1600 : undefined }}>
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
            {/* Sort by skills row — only when user has skills */}
            {userSkills.length > 0 && (
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
            {/* Horizontal filter bar */}
            <div style={{
              display: 'flex',
              gap: 10,
              padding: '12px 0 14px',
              marginBottom: 12,
              borderBottom: '1px solid var(--border)',
              overflowX: isXsSm ? 'auto' : 'visible',
              flexWrap: isXsSm ? 'nowrap' : 'wrap',
              WebkitOverflowScrolling: 'touch',
              maxHeight: isMd ? 88 : undefined,
              overflowY: isMd ? 'hidden' : undefined,
            }}>
              <select value={roleCategoryFilter ?? ''} onChange={e => setRoleCategoryFilter(e.target.value || null)} style={{ padding: '8px 12px', borderRadius: 999, border: '1.25px solid var(--border)', background: roleCategoryFilter ? 'var(--primary-soft)' : 'var(--surface-solid)', color: roleCategoryFilter ? 'var(--primary)' : 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                <option value="">Role: All</option>
                {ROLE_FILTER_OPTIONS.filter(o => o.value).map(opt => <option key={opt.label} value={opt.value!}>{opt.label}</option>)}
              </select>
              <select value={experienceBandFilter ?? ''} onChange={e => setExperienceBandFilter(e.target.value || null)} style={{ padding: '8px 12px', borderRadius: 999, border: '1.25px solid var(--border)', background: experienceBandFilter ? 'var(--primary-soft)' : 'var(--surface-solid)', color: experienceBandFilter ? 'var(--primary)' : 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                <option value="">Exp: All</option>
                {EXPERIENCE_FILTER_OPTIONS.filter(o => o.value).map(opt => <option key={opt.label} value={opt.value!}>{opt.label}</option>)}
              </select>
              <select value={workplaceFilter ?? ''} onChange={e => setWorkplaceFilter(e.target.value || null)} style={{ padding: '8px 12px', borderRadius: 999, border: '1.25px solid var(--border)', background: workplaceFilter ? 'var(--primary-soft)' : 'var(--surface-solid)', color: workplaceFilter ? 'var(--primary)' : 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                <option value="">Workplace: All</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
              </select>
              <select value={dateFilter ?? ''} onChange={e => setDateFilter(e.target.value || null)} style={{ padding: '8px 12px', borderRadius: 999, border: '1.25px solid var(--border)', background: dateFilter ? 'var(--primary-soft)' : 'var(--surface-solid)', color: dateFilter ? 'var(--primary)' : 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                <option value="">Date: All</option>
                <option value="1d">Past 24h</option>
                <option value="3d">Past 3d</option>
                <option value="7d">Past 7d</option>
              </select>
              <select value={platformFilter ?? ''} onChange={e => setPlatformFilter(e.target.value || null)} style={{ padding: '8px 12px', borderRadius: 999, border: '1.25px solid var(--border)', background: platformFilter ? 'var(--primary-soft)' : 'var(--surface-solid)', color: platformFilter ? 'var(--primary)' : 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                <option value="">Board: All</option>
                <option value="lever">Lever</option>
                <option value="greenhouse">Greenhouse</option>
                <option value="ashby">Ashby</option>
              </select>
              <select value={sel} onChange={e => { const company = e.target.value; if (!company) { setSp({}); } else { setSp({ company }); } }} style={{ padding: '8px 12px', borderRadius: 999, border: '1.25px solid var(--border)', background: sel ? 'var(--primary-soft)' : 'var(--surface-solid)', color: sel ? 'var(--primary)' : 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                <option value="">Companies: All</option>
                {cos.map(c => <option key={c.companyName} value={c.companyName}>{c.companyName}</option>)}
              </select>
              {isMd && (
                <button
                  onClick={() => setFilterModalOpen(true)}
                  style={{
                    minHeight: 36,
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1.25px solid var(--border)',
                    background: 'var(--surface-solid)',
                    color: 'var(--muted-ink)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontFamily: 'inherit',
                  }}
                >
                  Filters
                </button>
              )}
            </div>
            {/* Quick-access filter chips (mobile only) */}
            {(isXsSm || isMd) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {currentUser && (
                  <button
                    onClick={() => setHideApplied(h => !h)}
                    style={{
                      flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                      border: '1.25px solid var(--border)', cursor: 'pointer',
                      fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      background: hideApplied ? 'var(--primary)' : 'var(--surface-solid)',
                      color: hideApplied ? '#fff' : 'var(--muted-ink)',
                      fontWeight: hideApplied ? 600 : 400,
                      transition: 'all 0.18s',
                    }}
                  >
                    {hideApplied ? <><EyeOff size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Applied Hidden</> : <><Eye size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Hide Applied</>}
                  </button>
                )}
                {currentUser && newJobsCount > 0 && (
                  <button
                    onClick={() => setShowNewOnly(n => !n)}
                    style={{
                      flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                      border: '1.25px solid var(--border)', cursor: 'pointer',
                      fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      background: showNewOnly ? 'var(--primary)' : 'var(--surface-solid)',
                      color: showNewOnly ? '#fff' : 'var(--muted-ink)',
                      fontWeight: showNewOnly ? 600 : 400,
                      transition: 'all 0.18s',
                    }}
                  >
                    <Sparkles size={12} style={{ verticalAlign: -2, marginRight: 4 }} />New Only
                  </button>
                )}
                <button
                  onClick={() => setEntryLevelFilter(f => !f)}
                  style={{
                    flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                    border: '1.25px solid var(--border)', cursor: 'pointer',
                    fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'nowrap',
                    background: entryLevelFilter ? 'var(--primary)' : 'var(--surface-solid)',
                    color: entryLevelFilter ? '#fff' : 'var(--muted-ink)',
                    fontWeight: entryLevelFilter ? 600 : 400,
                    transition: 'all 0.18s',
                  }}
                >
                  <GraduationCap size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Fresher
                </button>
              </div>
            )}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 148 }} />)}</div>
            ) : visibleJobs.length === 0 ? (
              <EmptyState icon={<Briefcase size={36} />} title={searchQuery ? 'No jobs match your filters' : COPY.jobs.noJobsTitle} body={searchQuery ? 'No jobs match your filters. Try adjusting or clearing them.' : COPY.jobs.noJobsBody} action={<Button variant="ghost" onClick={clearAllFilters}>{COPY.jobs.clearFilters}</Button>} />
            ) : (
              <div style={{ display: 'flex', gap: 0, height: 'calc(100dvh - 220px)', minHeight: 420, overflow: 'hidden', border: '1.25px solid var(--border)', borderRadius: 14, background: 'var(--surface-solid)' }}>
                {/* Left Panel: Job List */}
                <div ref={listRef} className="thin-scroll" style={{
                  width: useBottomSheet ? '100%' : (is3xl ? 320 : isLg ? '40%' : '30%'),
                  minWidth: useBottomSheet ? undefined : (is3xl ? 320 : 280),
                  flexShrink: 0,
                  overflowY: 'auto',
                  borderRight: useBottomSheet ? 'none' : '1.25px solid var(--border)',
                  WebkitOverflowScrolling: 'touch',
                }}>
                  {listRenderMeta.map(meta => {
                    const j = meta.job;
                    return (
                      <JobListItem
                        key={j._id}
                        job={j}
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
                      />
                    );
                  })}
                  {visibleJobs.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '12px 0', fontSize: '0.75rem', color: 'var(--muted-ink)' }}>Showing {visibleJobs.length} jobs</div>
                  )}
                </div>
                {/* Right Panel: Detail */}
                {!useBottomSheet && (
                  <div ref={detailPanelRef} className="thin-scroll" style={{ width: isLg ? '60%' : '70%', flex: isLg ? '1 1 60%' : '1 1 70%', overflowY: 'auto', padding: is3xl ? '28px 36px' : '24px 32px', WebkitOverflowScrolling: 'touch' }}>
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
              if (endY - startY > 70) closeMobileSheet();
            }}
            style={{
              position: 'fixed',
              left: 0, right: 0, bottom: 0,
              height: isShortLandscape ? '90dvh' : (isMd ? '75dvh' : '85dvh'),
              zIndex: 201,
              background: 'var(--surface-solid)',
              borderRadius: '20px 20px 0 0',
              display: 'flex', flexDirection: 'column',
              animation: 'sheetSlideUp 0.28s ease',
            }}
          >
            {/* Sticky header */}
            <div style={{
              padding: '12px 16px',
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
            <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 16px', WebkitOverflowScrolling: 'touch' }}>
              <DetailPanel job={selectedJob} mobileMode />
            </div>
            <SheetActions job={selectedJob} />
          </div>
        </>
      )}

      {isMd && filterModalOpen && (
        <>
          <div onClick={() => setFilterModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.42)', zIndex: 220 }} />
          <div className="thin-scroll" style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 'min(92vw, 620px)', maxHeight: '78dvh', overflowY: 'auto', borderRadius: 16, border: '1.25px solid var(--border)', background: 'var(--surface-solid)', padding: 16, zIndex: 221 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--ink)' }}>Filters</span>
              <button onClick={() => setFilterModalOpen(false)} style={{ border: 'none', background: 'none', color: 'var(--muted-ink)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <select value={roleCategoryFilter ?? ''} onChange={e => setRoleCategoryFilter(e.target.value || null)} style={{ padding: '10px 12px', borderRadius: 12, border: '1.25px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.86rem' }}>
                <option value="">Role: All</option>
                {ROLE_FILTER_OPTIONS.filter(o => o.value).map(opt => <option key={opt.label} value={opt.value!}>{opt.label}</option>)}
              </select>
              <select value={experienceBandFilter ?? ''} onChange={e => setExperienceBandFilter(e.target.value || null)} style={{ padding: '10px 12px', borderRadius: 12, border: '1.25px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.86rem' }}>
                <option value="">Exp: All</option>
                {EXPERIENCE_FILTER_OPTIONS.filter(o => o.value).map(opt => <option key={opt.label} value={opt.value!}>{opt.label}</option>)}
              </select>
              <select value={workplaceFilter ?? ''} onChange={e => setWorkplaceFilter(e.target.value || null)} style={{ padding: '10px 12px', borderRadius: 12, border: '1.25px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.86rem' }}>
                <option value="">Workplace: All</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
              </select>
              <select value={dateFilter ?? ''} onChange={e => setDateFilter(e.target.value || null)} style={{ padding: '10px 12px', borderRadius: 12, border: '1.25px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--muted-ink)', fontFamily: 'inherit', fontSize: '0.86rem' }}>
                <option value="">Date: All</option>
                <option value="1d">Past 24h</option>
                <option value="3d">Past 3d</option>
                <option value="7d">Past 7d</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
