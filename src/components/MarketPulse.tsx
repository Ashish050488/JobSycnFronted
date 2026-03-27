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
        const total = data.categories.length + 4; // 4 non-data rows
        let i = 0;
        const id = setInterval(() => { i++; setVisible(i); if (i >= total) clearInterval(id); }, 65);
        return () => clearInterval(id);
    }, [data]);

    const maxRoles = data ? Math.max(...data.categories.map(c => c.totalRoles), 1) : 1;
    const MONO: React.CSSProperties = {
        fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code','Courier New',monospace",
    };

    return (
        <section style={{ padding: '80px 0', background: 'var(--surface-solid)', borderTop: '1.25px solid var(--border)' }}>
            <style>{`
        @keyframes mpBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        .mp-line { opacity:0; animation: mpIn 0.22s ease forwards; }
        @keyframes mpIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
      `}</style>

            <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>

                {/* Section header — outside terminal */}
                <div style={{ marginBottom: 24 }}>
                    <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
                        Market Pulse
                    </p>
                    <h2 style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, color: 'var(--ink)', marginBottom: 0 }}>
                        What's hot in Indian tech hiring
                    </h2>
                </div>

                {/* ── Terminal window ── */}
                <div style={{
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
                        {/* macOS traffic lights */}
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
                                {/* Row 1 — curl prompt */}
                                {visible >= 1 && (
                                    <div className="mp-line" style={{ marginBottom: 14, color: 'var(--muted-ink)', fontSize: '0.77rem' }}>
                                        <span style={{ color: 'var(--primary)', userSelect: 'none' }}>❯ </span>
                                        <span style={{ color: 'var(--ink)' }}>curl </span>
                                        <span style={{ color: '#60a5fa' }}>jobmesh.in/api/market-pulse</span>
                                        <span style={{ color: '#22c55e' }}> ✓ 200 OK</span>
                                        <span style={{ color: 'var(--subtle-ink)' }}> · {data.totalJobs.toLocaleString()} active roles</span>
                                    </div>
                                )}

                                {/* Row 2 — column headers */}
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

                                {/* Data rows */}
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
                                            {/* Name */}
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {cat.category}
                                            </span>
                                            {/* ASCII bar */}
                                            <span style={{ letterSpacing: '-0.5px', userSelect: 'none', lineHeight: 1, display: 'block', overflow: 'hidden' }}>
                                                <span style={{ color }}>{Array(fill).fill('█').join('')}</span>
                                                <span style={{ color: 'var(--border)', opacity: 0.7 }}>{Array(empty).fill('░').join('')}</span>
                                            </span>
                                            {/* Count */}
                                            <span style={{
                                                fontSize: '0.76rem', color: 'var(--muted-ink)',
                                                textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {cat.totalRoles}
                                            </span>
                                            {/* Trend */}
                                            <span style={{ textAlign: 'right' }}>
                                                <TrendTag pct={cat.trendPercent} trend={cat.trend} />
                                            </span>
                                        </div>
                                    );
                                })}

                                {/* Footer prompt */}
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
            </div>
        </section>
    );
}
