// FILE: src/components/CompanyIntel.tsx
// Redesigned: compact "radar strip" — horizontal stat chips + 7-day posting heatmap
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, Clock } from 'lucide-react';

interface CompanyIntelData {
    companyName: string;
    totalOpenRoles: number;
    newRolesThisWeek: number;
    newRolesLastWeek: number;
    avgRoleAgeDays: number;
    oldestRoleDays: number;
    newestRoleDays: number;
    hiringTrend: 'up' | 'down' | 'stable';
    peakPostingDay: string | null;
    busiestDays: string[];
    postingDayDistribution: number[];
}

const cache = new Map<string, CompanyIntelData>();

interface CompanyIntelProps {
    companyName: string;
    rolePostedDate: string | null;
}

function roleAgeDaysFromDate(date: string | null): number | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
}

// Days in Mon→Sun order for the bar chart
const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function FreshnessChip({ daysAgo }: { daysAgo: number }) {
    if (daysAgo <= 0) return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 999,
            background: 'rgba(22,163,74,0.12)', color: '#16a34a',
            fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(22,163,74,0.25)',
        }}>
            <Zap size={10} />Today
        </span>
    );
    if (daysAgo === 1) return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 999,
            background: 'rgba(22,163,74,0.10)', color: '#16a34a',
            fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(22,163,74,0.22)',
        }}>
            <Zap size={10} />Yesterday
        </span>
    );
    if (daysAgo <= 7) return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 999,
            background: 'var(--warning-soft)', color: 'var(--warning)',
            fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(217,119,6,0.22)',
        }}>
            <Clock size={10} />{daysAgo}d ago
        </span>
    );
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 999,
            background: 'var(--danger-soft)', color: 'var(--danger)',
            fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(220,38,38,0.22)',
        }}>
            <Clock size={10} />{daysAgo}d ago
        </span>
    );
}

// Mini 7-bar posting frequency chart (Mon–Sun)
function PostingBars({ distribution, busiestDays }: { distribution: number[]; busiestDays: string[] }) {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const max = Math.max(...distribution, 1);
    const todayIdx = new Date().getDay(); // 0=Sun,1=Mon,...
    // remap: our array is Mon(0)..Sun(6), JS getDay Sun=0
    const todayBarIdx = todayIdx === 0 ? 6 : todayIdx - 1;

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28 }}>
            {DAYS_SHORT.map((label, i) => {
                const val = distribution[i] ?? 0;
                const height = Math.max(4, Math.round((val / max) * 24));
                const isBusiest = busiestDays.includes(DAYS_FULL[i]);
                const isToday = i === todayBarIdx;
                const barColor = isToday
                    ? (isBusiest ? '#16a34a' : 'var(--primary)')
                    : isBusiest
                        ? 'rgba(22,163,74,0.55)'
                        : 'var(--border-strong)';

                return (
                    <div key={i} title={`${DAYS_FULL[i]}: ${val} posts`}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <div style={{
                            width: 6, height, borderRadius: 2,
                            background: barColor,
                            transition: 'height 0.3s',
                            position: 'relative',
                        }}>
                            {isToday && (
                                <div style={{
                                    position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
                                    width: 4, height: 4, borderRadius: '50%',
                                    background: isBusiest ? '#16a34a' : 'var(--primary)',
                                }} />
                            )}
                        </div>
                        <span style={{ fontSize: 8, color: isToday ? 'var(--ink)' : 'var(--subtle-ink)', fontWeight: isToday ? 700 : 400 }}>{label}</span>
                    </div>
                );
            })}
            {busiestDays.includes(today) && (
                <span style={{
                    fontSize: '0.66rem', fontWeight: 700, color: '#16a34a',
                    marginLeft: 4, alignSelf: 'center', whiteSpace: 'nowrap',
                }}>
                    ✓ good day
                </span>
            )}
        </div>
    );
}

export default function CompanyIntel({ companyName, rolePostedDate }: CompanyIntelProps) {
    const [intel, setIntel] = useState<CompanyIntelData | null>(cache.get(companyName) ?? null);
    const [loading, setLoading] = useState(!cache.has(companyName));
    const [errored, setErrored] = useState(false);

    useEffect(() => {
        if (cache.has(companyName)) {
            setIntel(cache.get(companyName)!);
            setLoading(false);
            setErrored(false);
            return;
        }
        if (!companyName?.trim()) { setLoading(false); return; }
        let cancelled = false;
        setLoading(true);
        setErrored(false);
        fetch(`/api/jobs/company-intel/${encodeURIComponent(companyName.trim())}`)
            .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
            .then((data: CompanyIntelData) => {
                if (cancelled) return;
                cache.set(companyName, data);
                setIntel(data);
            })
            .catch(() => { if (!cancelled) setErrored(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [companyName]);

    const roleDaysAgo = roleAgeDaysFromDate(rolePostedDate);
    const TrendIcon = intel?.hiringTrend === 'up'
        ? TrendingUp : intel?.hiringTrend === 'down' ? TrendingDown : Minus;
    const trendColor = intel?.hiringTrend === 'up'
        ? '#16a34a' : intel?.hiringTrend === 'down'
            ? 'var(--danger)' : 'var(--subtle-ink)';

    return (
        <div style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--paper2)',
            border: '1px solid var(--border)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Accent line */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                background: 'linear-gradient(to bottom, var(--primary), transparent)',
                borderRadius: '10px 0 0 10px',
            }} />

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 6 }}>
                <span className="font-sketch" style={{
                    fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                    ⚡ Company Radar
                </span>
                {roleDaysAgo !== null && <FreshnessChip daysAgo={roleDaysAgo} />}
            </div>

            {loading ? (
                /* 3 skeleton chips in a row */
                <div style={{ display: 'flex', gap: 6, paddingLeft: 6 }}>
                    {[60, 80, 70].map((w, i) => (
                        <div key={i} className="skeleton" style={{ height: 26, borderRadius: 999, width: w }} />
                    ))}
                </div>
            ) : errored ? (
                <div style={{ fontSize: '0.74rem', color: 'var(--subtle-ink)', paddingLeft: 6 }}>
                    Intel unavailable
                </div>
            ) : intel ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 10px', paddingLeft: 6 }}>
                    {/* Open roles chip */}
                    <div title="Open roles at this company" style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 999,
                        background: 'var(--surface-solid)', border: '1px solid var(--border)',
                        fontSize: '0.74rem', color: 'var(--ink)', fontWeight: 600,
                    }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: "'Caveat', sans-serif", fontSize: '0.92rem' }}>
                            {intel.totalOpenRoles}
                        </span>
                        <span style={{ color: 'var(--subtle-ink)', fontWeight: 400 }}>open roles</span>
                    </div>

                    {/* This week chip + trend arrow */}
                    <div title={`${intel.newRolesThisWeek} new roles posted this week`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 999,
                        background: 'var(--surface-solid)', border: '1px solid var(--border)',
                        fontSize: '0.74rem', color: 'var(--ink)',
                    }}>
                        <TrendIcon size={11} color={trendColor} />
                        <span style={{ fontWeight: 800, color: trendColor, fontFamily: "'Caveat', sans-serif", fontSize: '0.92rem' }}>
                            +{intel.newRolesThisWeek}
                        </span>
                        <span style={{ color: 'var(--subtle-ink)', fontWeight: 400 }}>this week</span>
                    </div>

                    {/* Avg age chip */}
                    {intel.avgRoleAgeDays > 0 && (
                        <div title={`Roles stay open ~${intel.avgRoleAgeDays} days on average`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 999,
                            background: 'var(--surface-solid)', border: '1px solid var(--border)',
                            fontSize: '0.74rem', color: 'var(--ink)',
                        }}>
                            <span style={{ fontWeight: 800, fontFamily: "'Caveat', sans-serif", fontSize: '0.92rem' }}>
                                ~{intel.avgRoleAgeDays}d
                            </span>
                            <span style={{ color: 'var(--subtle-ink)', fontWeight: 400 }}>avg open</span>
                        </div>
                    )}

                    {/* Divider + posting day bars */}
                    {intel.postingDayDistribution.length > 0 && (
                        <>
                            <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />
                            <PostingBars
                                distribution={intel.postingDayDistribution}
                                busiestDays={intel.busiestDays}
                            />
                        </>
                    )}
                </div>
            ) : null}
        </div>
    );
}
