// FILE: src/components/SimilarJobs.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildSkillsRegex } from './JobDetailPanel';

interface SimilarJob {
    _id: string;
    JobTitle: string;
    Company: string;
    Location: string | null;
    ApplicationURL: string;
    PostedDate: string | null;
    scrapedAt: string | null;
    autoTags?: { techStack?: string[] };
}

interface SimilarJobsProps {
    jobId: string;
    company: string;
    userSkills: string[];
    onSelectJob?: (jobId: string) => void;
}

// Module-level cache keyed by jobId
const cache = new Map<string, SimilarJob[]>();

function logoFromUrl(url: string) {
    try { return new URL(url).hostname.replace('www.', ''); }
    catch { return 'example.com'; }
}

function matchScore(job: SimilarJob, skills: string[]): number {
    if (!skills.length) return 0;
    const techStack = job.autoTags?.techStack?.join(' ') ?? '';
    const text = `${job.JobTitle} ${techStack}`.toLowerCase();
    let matched = 0;
    for (const skill of skills) {
        const re = buildSkillsRegex([skill]);
        if (re && re.test(text)) matched++;
    }
    return skills.length > 0 ? Math.round((matched / skills.length) * 100) : 0;
}

function matchBadgeStyle(pct: number) {
    if (pct >= 70) return { bg: '#dcfce7', color: '#166534' };
    if (pct >= 40) return { bg: '#fef3c7', color: '#92400e' };
    return { bg: 'var(--paper2)', color: 'var(--muted-ink)' };
}

function MiniCard({ job, skills, onSelectJob }: { job: SimilarJob; skills: string[]; onSelectJob?: (id: string) => void }) {
    const [logoErr, setLogoErr] = useState(false);
    const [hovered, setHovered] = useState(false);
    const navigate = useNavigate();
    const pct = matchScore(job, skills);

    const handleClick = () => {
        if (onSelectJob) {
            onSelectJob(job._id);
        } else {
            navigate(`/jobs?selectedJob=${job._id}`);
        }
    };

    return (
        <div
            onClick={handleClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered ? 'var(--paper2)' : 'var(--surface-solid)',
                border: `1.25px solid ${hovered ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
                transition: 'all 0.18s', display: 'flex', gap: 10, alignItems: 'flex-start',
            }}
        >
            {/* Logo */}
            <div style={{
                width: 32, height: 32, flexShrink: 0, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--paper2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', padding: 3,
            }}>
                {logoErr ? (
                    <span style={{
                        fontFamily: "'Playfair Display',serif", fontSize: '0.9rem',
                        color: 'var(--primary)', fontWeight: 700,
                    }}>
                        {(job.Company || '?').charAt(0)}
                    </span>
                ) : (
                    <img
                        src={`https://logo.clearbit.com/${logoFromUrl(job.ApplicationURL)}`}
                        alt={job.Company}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        onError={() => setLogoErr(true)}
                    />
                )}
            </div>

            {/* Text */}
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                    fontWeight: 600, fontSize: '0.82rem', color: 'var(--ink)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                }}>
                    {job.JobTitle}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted-ink)', marginTop: 2 }}>
                    {job.Company}{job.Location ? ` · ${job.Location.split(',')[0]}` : ''}
                </div>
                {skills.length > 0 && pct > 0 && (
                    <span style={{
                        display: 'inline-block', marginTop: 5,
                        fontSize: '0.65rem', fontWeight: 600,
                        borderRadius: 999, padding: '1px 7px',
                        background: matchBadgeStyle(pct).bg,
                        color: matchBadgeStyle(pct).color,
                    }}>
                        {pct}% match
                    </span>
                )}
            </div>
        </div>
    );
}

export default function SimilarJobs({ jobId, company: _company, userSkills, onSelectJob }: SimilarJobsProps) {
    // Cache key includes skill count so changing skills invalidates stale cache
    const cacheKey = `${jobId}::${userSkills.length}`;
    const [jobs, setJobs] = useState<SimilarJob[]>(cache.get(cacheKey) ?? []);
    const [loading, setLoading] = useState(!cache.has(cacheKey));

    useEffect(() => {
        if (cache.has(cacheKey)) {
            setJobs(cache.get(cacheKey)!);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        fetch(`/api/jobs/similar/${jobId}`)
            .then(r => r.ok ? r.json() : [])
            .then((data: unknown) => {
                if (cancelled) return;
                const arr = Array.isArray(data) ? (data as SimilarJob[]) : [];
                // Sort by skill match descending, take top 4
                const sorted = [...arr].sort((a, b) => matchScore(b, userSkills) - matchScore(a, userSkills)).slice(0, 4);
                cache.set(cacheKey, sorted);
                setJobs(sorted);
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [cacheKey, jobId, userSkills]);

    if (!loading && jobs.length === 0) return null;

    return (
        <div style={{ marginTop: 28 }}>
            <p className="font-sketch" style={{
                fontSize: 15, fontWeight: 600, color: 'var(--primary)', marginBottom: 14,
            }}>
                Similar roles you might like
            </p>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
                    ))}
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: jobs.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 10,
                }}>
                    {jobs.map(job => (
                        <MiniCard key={job._id} job={job} skills={userSkills} onSelectJob={onSelectJob} />
                    ))}
                </div>
            )}
        </div>
    );
}
