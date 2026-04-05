// FILE: src/components/MarketPulse.tsx
import { useState, useEffect } from 'react';
import { roleBadgeStyle } from './JobDetailPanel';

interface CategoryData {
    category: string;
    totalRoles: number;
    newThisWeek: number;
    trendPercent: number;
    trend: 'up' | 'down' | 'stable';
}

interface MarketPulseData {
    categories: CategoryData[];
    totalJobs: number;
    updatedAt: string;
}

let sessionCache: MarketPulseData | null = null;

const BAR_LEN = 26;

function makeBar(count: number, max: number): { fill: number; empty: number } {
    const fill = Math.max(1, Math.round((count / max) * BAR_LEN));
    return { fill, empty: BAR_LEN - fill };
}

function TrendTag({ pct, trend }: { pct: number; trend: 'up' | 'down' | 'stable' }) {
    const mono: React.CSSProperties = { fontFamily: 'inherit', fontSize: '0.7rem', letterSpacing: 0 };
    if (pct === 100 && trend === 'up')
        return <span style={{ ...mono, color: 'var(--subtle-ink)' }}>[new]</span>;
    if (trend === 'up')
        return <span style={{ ...mono, color: '#22c55e', fontWeight: 700 }}>[↑{pct}%]</span>;
    if (trend === 'down')
        return <span style={{ ...mono, color: '#f87171', fontWeight: 700 }}>[↓{Math.abs(pct)}%]</span>;
    return <span style={{ ...mono, color: 'var(--muted-ink)' }}>[──]</span>;
}



function Cursor() {
    return (
        <span style={{
            display: 'inline-block', width: 7, height: '0.85em',
            background: 'var(--primary)', verticalAlign: 'text-bottom',
            marginLeft: 3, borderRadius: 1,
            animation: 'mpBlink 1.1s step-end infinite',
        }} />
    );
}

export default function MarketPulse() {
    const [data, setData] = useState<MarketPulseData | null>(sessionCache);
    const [loading, setLoading] = useState(!sessionCache);
    const [visible, setVisible] = useState(0);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (sessionCache) { setData(sessionCache); setLoading(false); return; }
        let cancelled = false;
        fetch('/api/jobs/market-pulse')
            .then(r => r.ok ? r.json() : null)
            .then((d: MarketPulseData | null) => {
                if (cancelled || !d) return;
                sessionCache = d;
                setData(d);
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // Stagger rows in like terminal output
    useEffect(() => {
        if (!data) return;
        setVisible(0);
        const total = data.categories.length + 4;
        let i = 0;
        const id = setInterval(() => { i++; setVisible(i); if (i >= total) clearInterval(id); }, 65);
        return () => clearInterval(id);
    }, [data]);

    const maxRoles = data ? Math.max(...data.categories.map(c => c.totalRoles), 1) : 1;
    const MONO: React.CSSProperties = {
        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','Courier New',monospace",
    };

    return (
        <section style={{ padding: isMobile ? '56px 0' : '80px 0', background: 'var(--surface-solid)', borderTop: '1.25px solid var(--border)' }}>
            <style>{`
        @keyframes mpBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .mp-line { opacity:0; animation: mpIn 0.22s ease forwards; }
        @keyframes mpIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
      `}</style>

            <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>

                {/* Section header */}
                <div style={{ marginBottom: isMobile ? 18 : 24 }}>
                    <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
                        Market Pulse
                    </p>
                    <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, color: 'var(--ink)', marginBottom: 0 }}>
                        What's hot in Indian tech hiring
                    </h2>
                </div>

                {/* ── Desktop: Terminal window ── */}
                <div className="mp-desktop" style={{
                    borderRadius: 14,
                    border: '1.25px solid var(--border)',
                    overflow: 'hidden',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.13)',
                    ...MONO,
                }}>
                    {/* Title bar */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        padding: '10px 16px',
                        background: 'var(--paper2)',
                        borderBottom: '1px solid var(--border)',
                    }}>
                        {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
                            <span key={i} style={{
                                width: 12, height: 12, borderRadius: '50%',
                                background: c, display: 'inline-block', flexShrink: 0,
                            }} />
                        ))}
                        <span style={{
                            flex: 1, textAlign: 'center',
                            fontSize: '0.72rem', color: 'var(--muted-ink)',
                            letterSpacing: '0.03em',
                        }}>
                            market-pulse — live@jobmesh:~$
                        </span>
                    </div>

                    {/* Terminal body */}
                    <div style={{
                        background: 'var(--paper)',
                        padding: '20px 22px 18px',
                        minHeight: 220,
                        fontSize: '0.8rem',
                        lineHeight: 1.6,
                    }}>
                        {loading ? (
                            <div style={{ color: 'var(--muted-ink)' }}>
                                <span style={{ color: 'var(--primary)' }}>$ </span>
                                <span>fetching market data</span>
                                <Cursor />
                            </div>
                        ) : !data || data.categories.length === 0 ? (
                            <div style={{ color: 'var(--muted-ink)' }}>
                                <span style={{ color: 'var(--primary)' }}>$ </span>
                                no data yet.
                            </div>
                        ) : (
                            <div>
                                {visible >= 1 && (
                                    <div className="mp-line" style={{ marginBottom: 14, color: 'var(--muted-ink)', fontSize: '0.77rem' }}>
                                        <span style={{ color: 'var(--primary)', userSelect: 'none' }}>❯ </span>
                                        <span style={{ color: 'var(--ink)' }}>curl </span>
                                        <span style={{ color: '#60a5fa' }}>jobmesh.in/api/market-pulse</span>
                                        <span style={{ color: '#22c55e' }}> ✓ 200 OK</span>
                                        <span style={{ color: 'var(--subtle-ink)' }}> · {data.totalJobs.toLocaleString()} active roles</span>
                                    </div>
                                )}

                                {visible >= 2 && (
                                    <div className="mp-line" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '100px 1fr 52px 72px',
                                        gap: '0 10px',
                                        fontSize: '0.66rem',
                                        fontWeight: 700,
                                        color: 'var(--subtle-ink)',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        paddingBottom: 6,
                                        marginBottom: 4,
                                        borderBottom: '1px dashed var(--border)',
                                    }}>
                                        <span>category</span>
                                        <span>demand</span>
                                        <span style={{ textAlign: 'right' }}>roles</span>
                                        <span style={{ textAlign: 'right' }}>trend</span>
                                    </div>
                                )}

                                {data.categories.map((cat, i) => {
                                    if (visible < i + 3) return null;
                                    const { color } = roleBadgeStyle(cat.category);
                                    const { fill, empty } = makeBar(cat.totalRoles, maxRoles);
                                    return (
                                        <div
                                            key={cat.category}
                                            className="mp-line"
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '100px 1fr 52px 72px',
                                                gap: '0 10px',
                                                alignItems: 'center',
                                                padding: '3px 0',
                                                animationDelay: `${i * 0.03}s`,
                                            }}
                                        >
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {cat.category}
                                            </span>
                                            <span style={{ letterSpacing: '-0.5px', userSelect: 'none', lineHeight: 1, display: 'block', overflow: 'hidden' }}>
                                                <span style={{ color }}>{Array(fill).fill('█').join('')}</span>
                                                <span style={{ color: 'var(--border)', opacity: 0.7 }}>{Array(empty).fill('░').join('')}</span>
                                            </span>
                                            <span style={{
                                                fontSize: '0.76rem', color: 'var(--muted-ink)',
                                                textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {cat.totalRoles}
                                            </span>
                                            <span style={{ textAlign: 'right' }}>
                                                <TrendTag pct={cat.trendPercent} trend={cat.trend} />
                                            </span>
                                        </div>
                                    );
                                })}

                                {visible >= data.categories.length + 3 && (
                                    <div className="mp-line" style={{
                                        marginTop: 12, paddingTop: 10,
                                        borderTop: '1px dashed var(--border)',
                                        fontSize: '0.72rem', color: 'var(--subtle-ink)',
                                    }}>
                                        <span style={{ color: 'var(--primary)', userSelect: 'none' }}>❯ </span>
                                        trends activate after 14 days of scrape history
                                        <Cursor />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Mobile: Horizontally scrollable glassmorphism cards ── */}
                <div className="mp-mobile" style={{ display: 'none' }}>
                    {loading ? (
                        <div style={{ display: 'flex', gap: 14, overflowX: 'hidden', padding: '4px 0' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton" style={{ minWidth: 200, height: 180, borderRadius: 20, flexShrink: 0 }} />
                            ))}
                        </div>
                    ) : !data || data.categories.length === 0 ? (
                        <div style={{
                            padding: '32px 20px', textAlign: 'center',
                            border: '1.25px dashed var(--border)', borderRadius: 14,
                            color: 'var(--muted-ink)', fontSize: '0.88rem',
                        }}>
                            No market data available yet.
                        </div>
                    ) : (
                        <>
                            <style>{`
                                @keyframes mpPulse { 0%,100%{box-shadow:0 0 0 0 var(--primary-soft)} 50%{box-shadow:0 0 0 8px transparent} }
                                @keyframes mpRingFill { from{stroke-dashoffset:var(--ring-full)} to{stroke-dashoffset:var(--ring-offset)} }
                                @keyframes mpCountUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
                                .mp-card-carousel { display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:8px 4px 16px;margin:0 -4px }
                                .mp-card-carousel::-webkit-scrollbar { display:none }
                                .mp-stat-card { scroll-snap-align:center;flex-shrink:0;min-width:170px;width:44vw;max-width:210px;position:relative;border-radius:20px;padding:18px 16px 14px;display:flex;flex-direction:column;gap:10px;overflow:hidden;border:1.25px solid var(--border);transition:transform 0.2s,box-shadow 0.2s }
                                .mp-stat-card:active { transform:scale(0.97) }
                            `}</style>

                            {/* Live counter header */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0 4px', marginBottom: 4,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: '#22c55e',
                                        animation: 'mpPulse 2s ease infinite',
                                    }} />
                                    <span style={{
                                        fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)',
                                        fontVariantNumeric: 'tabular-nums',
                                    }}>
                                        {data.totalJobs.toLocaleString()} active roles
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--subtle-ink)' }}>
                                    scroll →
                                </span>
                            </div>

                            {/* Scrollable cards */}
                            <div className="mp-card-carousel">
                                {data.categories.map((cat, i) => {
                                    const { bg, color } = roleBadgeStyle(cat.category);
                                    const pct = Math.round((cat.totalRoles / maxRoles) * 100);
                                    const circumference = 2 * Math.PI * 28;
                                    const offset = circumference - (pct / 100) * circumference;
                                    const trendColor = cat.trend === 'up' ? '#22c55e' : cat.trend === 'down' ? '#f87171' : 'var(--muted-ink)';
                                    const trendIcon = cat.trend === 'up' ? '↑' : cat.trend === 'down' ? '↓' : '–';

                                    return (
                                        <div
                                            key={cat.category}
                                            className="mp-stat-card anim-up"
                                            style={{
                                                background: 'var(--surface-solid)',
                                                animationDelay: `${i * 0.08}s`,
                                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                                            }}
                                        >
                                            {/* Gradient accent strip */}
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                                background: `linear-gradient(90deg, ${color}, ${bg})`,
                                                borderRadius: '20px 20px 0 0',
                                            }} />

                                            {/* Category label + trend */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{
                                                    fontSize: '0.74rem', padding: '3px 10px', borderRadius: 999,
                                                    background: bg, color: color, fontWeight: 700,
                                                }}>
                                                    {cat.category}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.72rem', fontWeight: 700, color: trendColor,
                                                    display: 'flex', alignItems: 'center', gap: 2,
                                                }}>
                                                    {trendIcon} {cat.trendPercent === 100 && cat.trend === 'up' ? 'new' : cat.trendPercent > 0 ? `${cat.trendPercent}%` : ''}
                                                </span>
                                            </div>

                                            {/* Ring chart + count */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
                                                <svg width="60" height="60" viewBox="0 0 64 64" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
                                                    <circle cx="32" cy="32" r="28" fill="none" stroke="var(--border)" strokeWidth="5" opacity="0.4" />
                                                    <circle
                                                        cx="32" cy="32" r="28" fill="none"
                                                        stroke={color} strokeWidth="5"
                                                        strokeLinecap="round"
                                                        strokeDasharray={circumference}
                                                        strokeDashoffset={offset}
                                                        style={{
                                                            '--ring-full': `${circumference}px`,
                                                            '--ring-offset': `${offset}px`,
                                                            animation: `mpRingFill 1s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.1}s both`,
                                                        } as React.CSSProperties}
                                                    />
                                                </svg>

                                                <div>
                                                    <div className="font-sketch" style={{
                                                        fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)',
                                                        lineHeight: 1, fontVariantNumeric: 'tabular-nums',
                                                        animation: `mpCountUp 0.5s ease ${0.4 + i * 0.1}s both`,
                                                    }}>
                                                        {cat.totalRoles}
                                                    </div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--subtle-ink)', marginTop: 2 }}>
                                                        open roles
                                                    </div>
                                                </div>
                                            </div>

                                            {/* New this week */}
                                            {cat.newThisWeek > 0 && (
                                                <div style={{
                                                    fontSize: '0.7rem', color: 'var(--muted-ink)',
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    paddingTop: 4, borderTop: '1px dashed var(--border)',
                                                }}>
                                                    <span style={{ color: '#22c55e' }}>+{cat.newThisWeek}</span> new this week
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <p style={{
                                fontSize: '0.72rem', color: 'var(--subtle-ink)',
                                textAlign: 'center', marginTop: 6,
                            }}>
                                Trends activate after 14 days of scrape history
                            </p>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
