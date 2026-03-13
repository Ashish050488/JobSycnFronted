// FILE: src/pages/Dashboard.tsx
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, X, SlidersHorizontal, MapPin, Building2, Clock, ExternalLink, Loader2, ArrowLeft, Search, CheckCircle2, Eye, EyeOff, Sparkles, GraduationCap, Filter } from 'lucide-react';
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
        <div style={{ width: 32, height: 32, flexShrink: 0, background: 'var(--surface-solid)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 4 }}>
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalJobs, setTotalJobs] = useState(0);
  const [workplaceFilter, setWorkplaceFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<IJob | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [hideApplied, setHideApplied] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);
  const [entryLevelFilter, setEntryLevelFilter] = useState(false);
  const [roleCategoryFilter, setRoleCategoryFilter] = useState<string | null>(null);
  const [experienceBandFilter, setExperienceBandFilter] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'match'>('default');
  const [comeBackMap, setComeBackMap] = useState<Map<string, { note: string; addedAt: string }>>(new Map());
  const [showComeBackOnly, setShowComeBackOnly] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const detailPanelRef = useRef<HTMLDivElement | null>(null);
  const visibleJobsRef = useRef<IJob[]>([]);
  const savedListScrollTopRef = useRef<number | null>(null);
  const initializedSelectionRef = useRef(false);
  const isMobile = useIsMobile();
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

  // Lock body scroll when mobile sheet or filter sheet is open
  useEffect(() => {
    if (mobileSheetOpen || mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileSheetOpen, mobileFilterOpen]);
  useEffect(() => { document.title = COPY.site.documentTitleJobs; }, []);
  const sel = sp.get('company') || '';
  const selectedJobParam = sp.get('selectedJob') || '';

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

  useEffect(() => {
    if (!selectedJobParam) return;

    const existing = jobs.find(job => job._id === selectedJobParam);
    if (existing) {
      setSelectedJob(existing);
      if (isMobile) setMobileSheetOpen(true);
      return;
    }

    let cancelled = false;
    fetch(`/api/jobs/${encodeURIComponent(selectedJobParam)}`)
      .then(r => r.ok ? r.json() : null)
      .then((job: IJob | null) => {
        if (!cancelled && job) {
          setSelectedJob(job);
          if (isMobile) setMobileSheetOpen(true);
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [selectedJobParam, jobs, isMobile]);

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

  const isJobNew = useCallback((job: IJob): boolean => {
    if (!previousVisitAt) return false;
    const d = job.PostedDate || job.scrapedAt;
    if (!d) return false;
    const jobDate = new Date(d);
    if (isNaN(jobDate.getTime())) return false;
    return jobDate.getTime() > new Date(previousVisitAt).getTime();
  }, [previousVisitAt]);

  const appliedCount = useMemo(() => {
    return jobs.filter(j => appliedJobIds.has(j._id)).length;
  }, [jobs, appliedJobIds]);

  const newJobsCount = useMemo(() => {
    return jobs.filter(isJobNew).length;
  }, [jobs, isJobNew]);

  // Pre-compute skill match count per job — keyed by _id
  const skillMatchMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!userSkills.length) return map;
    for (const job of jobs) {
      const text = stripHtmlText(job.DescriptionCleaned || job.Description || '');
      let count = 0;
      for (const skill of userSkills) {
        const esc = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const start = /\w/.test(skill[0]) ? '\\b' : '';
        const end = /\w/.test(skill[skill.length - 1]) ? '\\b' : '';
        if (new RegExp(`${start}${esc}${end}`, 'i').test(text)) count++;
      }
      map.set(job._id, count);
    }
    return map;
  }, [jobs, userSkills]);

  const visibleJobs = useMemo(() => {
    const filtered = jobs.filter(job => {
    const autoTags = getAutoTags(job);
    if (hideApplied && appliedJobIds.has(job._id)) return false;
    if (showNewOnly && !isJobNew(job)) return false;
    if (entryLevelFilter && !autoTags.isEntryLevel) return false;
    if (roleCategoryFilter && autoTags.roleCategory !== roleCategoryFilter) return false;
    if (experienceBandFilter && autoTags.experienceBand !== experienceBandFilter) return false;
    if (showComeBackOnly && !comeBackMap.has(job._id)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = (job.JobTitle ?? '').toLowerCase();
      const company = (job.Company ?? '').toLowerCase();
      const location = (job.Location ?? '').toLowerCase();
      const dept = (job.Department ?? '').toLowerCase();
      const tags = Array.isArray(job.Tags) ? job.Tags.map(t => t.toLowerCase()) : [];
      const techStack = autoTags.techStack.map(t => t.toLowerCase());
      if (!title.includes(q) && !company.includes(q) && !location.includes(q) && !dept.includes(q) && !tags.some(t => t.includes(q)) && !techStack.some(t => t.includes(q))) return false;
    }
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
    if (showComeBackOnly) {
      return [...filtered].sort((a, b) => {
        const aAt = comeBackMap.get(a._id)?.addedAt ?? '';
        const bAt = comeBackMap.get(b._id)?.addedAt ?? '';
        return bAt.localeCompare(aAt);
      });
    }
    if (sortBy === 'match' && userSkills.length > 0) {
      return [...filtered].sort((a, b) => (skillMatchMap.get(b._id) ?? 0) - (skillMatchMap.get(a._id) ?? 0));
    }
    return filtered;
  }, [jobs, searchQuery, workplaceFilter, platformFilter, dateFilter, hideApplied, appliedJobIds, showNewOnly, isJobNew, entryLevelFilter, roleCategoryFilter, experienceBandFilter, sortBy, userSkills, skillMatchMap, showComeBackOnly, comeBackMap]);

  useEffect(() => {
    visibleJobsRef.current = visibleJobs;
  }, [visibleJobs]);

  const listRenderMeta = useMemo(() => {
    return visibleJobs.map(job => {
      const autoTags = getAutoTags(job);
      const score = skillMatchMap.get(job._id) ?? 0;
      return {
        job,
        isApplied: appliedJobIds.has(job._id),
        isComeBack: comeBackMap.has(job._id),
        comeBackNote: comeBackMap.get(job._id)?.note ?? '',
        isNew: isJobNew(job),
        relativeTime: relTime(job.PostedDate || job.scrapedAt || null),
        visibleBadges: compactJobBadges(job),
        showSkillMatch: userSkills.length > 0 && !autoTags.techStack.length,
        skillMatchText: `${score}/${userSkills.length} match`,
        skillMatchBg: score === 0 ? 'var(--paper2)' : score <= 2 ? '#fef3c7' : '#dcfce7',
        skillMatchColor: score === 0 ? 'var(--muted-ink)' : score <= 2 ? '#92400e' : '#166534',
      };
    });
  }, [visibleJobs, skillMatchMap, appliedJobIds, comeBackMap, isJobNew, userSkills]);

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
    if (selectedJobParam || isMobile) return;
    if (loading) return;
    if (visibleJobs.length === 0) {
      setSelectedJob(null);
      return;
    }
    setSelectedJob(visibleJobs[0]);
    initializedSelectionRef.current = true;
  }, [loading, visibleJobs, selectedJobParam, isMobile]);

  // Filter/search changes should reset list position and select first result
  useEffect(() => {
    if (selectedJobParam || isMobile) return;
    const jobsNow = visibleJobsRef.current;
    if (jobsNow.length === 0) {
      setSelectedJob(null);
      if (listRef.current) listRef.current.scrollTop = 0;
      return;
    }
    setSelectedJob(jobsNow[0]);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [filterSelectionKey, selectedJobParam, isMobile]);

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

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (workplaceFilter) c++;
    if (platformFilter) c++;
    if (dateFilter) c++;
    if (hideApplied) c++;
    if (showNewOnly) c++;
    if (entryLevelFilter) c++;
    if (roleCategoryFilter) c++;
    if (experienceBandFilter) c++;
    if (showComeBackOnly) c++;
    if (sel) c++;
    if (sortBy === 'match') c++;
    return c;
  }, [workplaceFilter, platformFilter, dateFilter, hideApplied, showNewOnly, entryLevelFilter, roleCategoryFilter, experienceBandFilter, showComeBackOnly, sel, sortBy]);

  const FilterContent = ({ companyMaxH = '72vh' }: { companyMaxH?: string }) => (
    <>
      {/* My Jobs filter */}
      {currentUser && (
        <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={12} color="var(--primary)" />
            <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>My Jobs</span>
          </div>
          <div style={{ padding: 8 }}>
            <button
              onClick={() => setHideApplied(h => !h)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10,
                border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit',
                background: hideApplied ? 'var(--primary-soft)' : 'transparent',
                color: hideApplied ? 'var(--primary)' : 'var(--muted-ink)',
                fontWeight: hideApplied ? 700 : 400,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 6, transition: 'all 0.22s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {hideApplied ? <EyeOff size={13} /> : <Eye size={13} />}
                Hide Applied
              </span>
              {appliedCount > 0 && (
                <span style={{ fontSize: '0.75rem', background: 'var(--paper2)', color: 'var(--subtle-ink)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{appliedCount}</span>
              )}
            </button>
            {currentUser && newJobsCount > 0 && (
              <button
                onClick={() => setShowNewOnly(n => !n)}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10,
                  border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit',
                  background: showNewOnly ? 'var(--primary-soft)' : 'transparent',
                  color: showNewOnly ? 'var(--primary)' : 'var(--muted-ink)',
                  fontWeight: showNewOnly ? 700 : 400,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 6, transition: 'all 0.22s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} />
                  Show New Only
                </span>
                <span style={{ fontSize: '0.75rem', background: 'var(--paper2)', color: 'var(--subtle-ink)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{newJobsCount}</span>
              </button>
            )}
            {currentUser && comeBackMap.size > 0 && (
              <button
                onClick={() => setShowComeBackOnly(c => !c)}
                style={{
                  width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10,
                  border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit',
                  background: showComeBackOnly ? '#fef3c7' : 'transparent',
                  color: showComeBackOnly ? '#92400e' : 'var(--muted-ink)',
                  fontWeight: showComeBackOnly ? 700 : 400,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 6, transition: 'all 0.22s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={13} style={{ color: showComeBackOnly ? '#d97706' : '#d97706' }} />
                  Come Back To
                </span>
                <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{comeBackMap.size}</span>
              </button>
            )}
          </div>
        </div>
      )}
      {/* Role type filter */}
      <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Briefcase size={12} color="var(--primary)" />
          <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>Role Type</span>
        </div>
        <div style={{ padding: 8 }}>
          {ROLE_FILTER_OPTIONS.map(opt => (
            <button key={opt.label} onClick={() => setRoleCategoryFilter(opt.value)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: roleCategoryFilter === opt.value ? 'var(--primary-soft)' : 'transparent', color: roleCategoryFilter === opt.value ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: roleCategoryFilter === opt.value ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {/* Experience filter */}
      <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={12} color="var(--primary)" />
          <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>Experience</span>
        </div>
        <div style={{ padding: 8 }}>
          {EXPERIENCE_FILTER_OPTIONS.map(opt => (
            <button key={opt.label} onClick={() => setExperienceBandFilter(opt.value)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: experienceBandFilter === opt.value ? 'var(--primary-soft)' : 'transparent', color: experienceBandFilter === opt.value ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: experienceBandFilter === opt.value ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}>
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setEntryLevelFilter(f => !f)}
            style={{
              width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10,
              border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit',
              background: entryLevelFilter ? 'var(--primary-soft)' : 'transparent',
              color: entryLevelFilter ? 'var(--primary)' : 'var(--muted-ink)',
              fontWeight: entryLevelFilter ? 700 : 400,
              display: 'flex', alignItems: 'center',
              gap: 6, transition: 'all 0.22s',
            }}
          >
            <GraduationCap size={13} />
            Entry Level / Fresher
          </button>
        </div>
      </div>
      {/* Workplace filter */}
      <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12 }}>WP</span>
          <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>Workplace</span>
        </div>
        <div style={{ padding: 8 }}>
          {([{ label: 'All', value: null }, { label: 'Remote', value: 'remote' }, { label: 'Hybrid', value: 'hybrid' }, { label: 'On-site', value: 'on-site' }] as const).map(opt => (
            <button key={opt.label} onClick={() => setWorkplaceFilter(opt.value)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: workplaceFilter === opt.value ? 'var(--primary-soft)' : 'transparent', color: workplaceFilter === opt.value ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: workplaceFilter === opt.value ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}>
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
            <button key={opt.label} onClick={() => setDateFilter(opt.value)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: dateFilter === opt.value ? 'var(--primary-soft)' : 'transparent', color: dateFilter === opt.value ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: dateFilter === opt.value ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {/* Platform filter */}
      <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12 }}>JB</span>
          <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>Job Board</span>
        </div>
        <div style={{ padding: 8 }}>
          {([{ label: 'All', value: null }, { label: 'Lever', value: 'lever' }, { label: 'Greenhouse', value: 'greenhouse' }, { label: 'Ashby', value: 'ashby' }] as const).map(opt => (
            <button key={opt.label} onClick={() => setPlatformFilter(opt.value)} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: platformFilter === opt.value ? 'var(--primary-soft)' : 'transparent', color: platformFilter === opt.value ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: platformFilter === opt.value ? 700 : 400, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.22s', fontFamily: 'inherit' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {/* Companies */}
      <div style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1.25px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={12} color="var(--primary)" />
          <span className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{COPY.jobs.companiesLabel}</span>
        </div>
        <div className="thin-scroll" style={{ maxHeight: companyMaxH, overflowY: 'auto', padding: 8 }}>
          <SideBtn label={COPY.jobs.allJobs} active={!sel} onClick={() => { setSp({}); setMobileFilterOpen(false); }} />
          {cos.map(c => <SideBtn key={c.companyName} label={c.companyName} count={c.openRoles} active={sel === c.companyName} onClick={() => { setSp({ company: c.companyName }); setMobileFilterOpen(false); }} />)}
        </div>
      </div>
    </>
  );

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

  const SideBtn = ({ label, count, active, onClick }: { label: string; count?: number; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: active ? 'var(--primary-soft)' : 'transparent', color: active ? 'var(--primary)' : 'var(--muted-ink)', fontWeight: active ? 700 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.22s', fontFamily: 'inherit' }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{label}</span>
      {count !== undefined && <span style={{ fontSize: '0.75rem', background: 'var(--paper2)', color: 'var(--subtle-ink)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{count}</span>}
    </button>
  );

  const handleSelectJob = useCallback((job: IJob) => {
    if (listRef.current) {
      savedListScrollTopRef.current = listRef.current.scrollTop;
    }
    const next = new URLSearchParams(window.location.search);
    next.set('selectedJob', job._id);
    setSp(next);
    setSelectedJob(job);
    if (isMobile) setMobileSheetOpen(true);
  }, [setSp, isMobile]);

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

      const boilerplate = container.querySelector('.jd-boilerplate-sections') as HTMLElement | null;
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
        <p className="font-sketch" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>About this role</p>
        <div
          ref={descRef}
          className="job-description-html"
          style={{ fontSize: '0.92rem', lineHeight: 1.85, color: 'var(--muted-ink)', ...(mobileMode ? { padding: '12px 0' } : { overflowY: 'auto' as const, maxHeight: '55vh', padding: '12px 0' }) }}
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

  const closeMobileSheet = () => setMobileSheetOpen(false);

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      {/* Keyframe animations for mobile sheet */}
      <style>{`
        @keyframes sheetFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetSlideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '16px 0' }}>
        <Container>
          <PageHeader label={COPY.jobs.pageLabel} title={sel || COPY.jobs.pageTitle}
            subtitle={visibleJobs.length === totalJobs ? `${totalJobs} ${COPY.jobs.rolesAvailable}` : `${visibleJobs.length} of ${totalJobs} ${COPY.jobs.rolesAvailable}`}
            actions={sel ? <button onClick={clearAllFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1.25px solid var(--border)', background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' }}>{sel}<X size={11} /></button> : undefined} />
        </Container>
      </div>
      <Container style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <aside style={{ width: 210, flexShrink: 0, position: 'sticky', top: 76 }} className="hidden md:block">
            <FilterContent />
          </aside>
          <div style={{ flex: 1, minWidth: 0 }}>
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
                    width: '100%', padding: '10px 36px 10px 38px', borderRadius: 10,
                    border: '1.25px solid var(--border)', background: 'var(--surface-solid)',
                    color: 'var(--ink)', fontSize: '0.88rem', fontFamily: 'inherit',
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
              {isMobile && (
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 42, height: 42, flexShrink: 0, borderRadius: 10,
                    border: '1.25px solid var(--border)', background: 'var(--surface-solid)',
                    cursor: 'pointer', color: 'var(--muted-ink)',
                  }}
                >
                  <Filter size={18} />
                  {activeFilterCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -5, right: -5,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#E74C3C', color: '#fff',
                      fontSize: '0.65rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      lineHeight: 1,
                    }}>{activeFilterCount}</span>
                  )}
                </button>
              )}
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
            {/* Quick-access filter chips (mobile only) */}
            {isMobile && (
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
              <EmptyState icon={<Briefcase size={36} />} title={searchQuery ? 'No jobs match your search' : COPY.jobs.noJobsTitle} body={searchQuery ? 'Try different keywords or clear your search.' : COPY.jobs.noJobsBody} action={<Button variant="ghost" onClick={clearAllFilters}>{COPY.jobs.clearFilters}</Button>} />
            ) : (
              <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 180px)', overflow: 'hidden', border: '1.25px solid var(--border)', borderRadius: 14, background: 'var(--surface-solid)' }}>
                {/* Left Panel: Job List */}
                <div ref={listRef} className="thin-scroll" style={{ width: isMobile ? '100%' : 380, flexShrink: 0, overflowY: 'auto', borderRight: isMobile ? 'none' : '1.25px solid var(--border)' }}>
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
                {/* Right Panel: Detail */}
                {!isMobile && (
                  <div ref={detailPanelRef} className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
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

      {/* Mobile filter bottom sheet */}
      {isMobile && mobileFilterOpen && (
        <>
          <div
            onClick={() => setMobileFilterOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.4)',
              animation: 'sheetFadeIn 0.2s ease',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 60, left: 0, right: 0, bottom: 0,
              zIndex: 201,
              background: 'var(--paper)',
              borderRadius: '20px 20px 0 0',
              display: 'flex', flexDirection: 'column',
              animation: 'sheetSlideUp 0.28s ease',
            }}
          >
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span className="font-sketch" style={{ fontSize: '1.05rem', color: 'var(--ink)', fontWeight: 600 }}>Filters</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600,
                  fontFamily: 'inherit', padding: '4px 8px',
                }}
              >Done</button>
            </div>
            <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 32px', WebkitOverflowScrolling: 'touch' }}>
              <FilterContent companyMaxH="40vh" />
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom sheet */}
      {isMobile && mobileSheetOpen && selectedJob && (
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
            style={{
              position: 'fixed',
              top: 40, left: 0, right: 0, bottom: 0,
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
            <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 32px' }}>
              <DetailPanel job={selectedJob} mobileMode />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
