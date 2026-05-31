// FILE: src/pages/Home.tsx
// Guest landing page. Notion-paper hero. Apple-grade spacing.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { COPY, BRAND } from '../theme/brand';
import { Container, Button } from '../components/ui';
import type { IJob, ICompany } from '../types';
import JobCard from '../components/JobCard';
import CompanyLogo from '../components/CompanyLogo';

export default function Home() {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `${BRAND.appName} — ${BRAND.tagline}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/jobs?limit=8').then(r => r.ok ? r.json() : { jobs: [] }),
      fetch('/api/jobs/directory').then(r => r.ok ? r.json() : []),
    ]).then(([j, c]) => {
      if (cancelled) return;
      setJobs((j?.jobs || j || []).slice(0, 8));
      setCompanies((Array.isArray(c) ? c : []).slice(0, 10));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        padding: 'clamp(56px, 10vw, 100px) 0 clamp(40px, 8vw, 72px)',
        overflow: 'hidden',
      }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }} />
        <div className="orb" style={{ width: 400, height: 400, top: -100, left: -100, background: 'var(--accent-soft)' }} />
        <div className="orb" style={{ width: 360, height: 360, top: -50, right: -120, background: 'var(--info-soft)' }} />

        <Container size="lg" style={{ position: 'relative' }}>
          <div className="anim-up" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: '0.78rem',
            fontWeight: 500,
            marginBottom: 18,
          }}>
            <Sparkles size={12} /> {COPY.home.heroLabel}
          </div>

          <h1 className="font-display anim-up" style={{
            fontSize: 'clamp(2.2rem, 7vw, 4rem)',
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            color: 'var(--ink)',
            marginBottom: 14,
            maxWidth: 820,
          }}>
            {COPY.home.heroTitle1}{' '}
            <span style={{ color: 'var(--accent)' }}>{COPY.home.heroTitle2}</span>
          </h1>
          <p className="anim-up" style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: 'var(--ink-muted)',
            maxWidth: 640,
            lineHeight: 1.55,
            marginBottom: 28,
          }}>
            {COPY.home.heroSubtitle}
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button as="a" href="/jobs" variant="primary" size="lg">
              {COPY.home.heroCTA} <ArrowRight size={16} />
            </Button>
            <Button as="a" href="/directory" variant="ghost" size="lg">
              <Building2 size={14} /> {COPY.home.heroSecondaryCTA}
            </Button>
          </div>

          {/* Stats inline */}
          <div style={{
            display: 'flex',
            gap: 28,
            marginTop: 40,
            flexWrap: 'wrap',
          }}>
            <Stat value={COPY.home.stat1Value} label={COPY.home.stat1Label} />
            <Stat value={COPY.home.stat2Value} label={COPY.home.stat2Label} />
            <Stat value="6 ATS" label="Sources scraped" />
          </div>
        </Container>
      </section>

      {/* ── COMPANIES CAROUSEL ───────────────────────────────── */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--border)' }}>
        <Container size="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={sectionLabel}>{COPY.home.companiesSectionLabel}</p>
              <h2 className="font-display" style={sectionTitle}>
                {COPY.home.companiesSectionTitle1} <span style={{ color: 'var(--accent)' }}>{COPY.home.companiesSectionTitle2}</span>
              </h2>
            </div>
            <Link to="/directory" style={linkStyle}>
              {COPY.home.fullDirectory} <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ position: 'relative' }}>
            <div className="snap-carousel" ref={carouselRef} style={{ gap: 12 }}>
              {(loading ? Array(6).fill(0) : companies).map((c, i) => (
                loading ? (
                  <div key={i} className="skeleton" style={{ minWidth: 200, height: 130, borderRadius: 12, flexShrink: 0 }} />
                ) : (
                  <Link
                    key={c._id || c.companyName}
                    to="/directory"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      minWidth: 200, maxWidth: 230,
                      padding: 14,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      textDecoration: 'none',
                      transition: 'all 180ms ease',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <CompanyLogo name={c.companyName} domain={c.domain} size={36} borderRadius={10} />
                    <div>
                      <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{c.companyName}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 3 }}>
                        {c.openRoles} open role{c.openRoles === 1 ? '' : 's'}
                      </p>
                    </div>
                  </Link>
                )
              ))}
            </div>
            {/* Scroll buttons (desktop) */}
            <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => scroll('left')} aria-label={COPY.home.scrollLeft} style={scrollBtn}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => scroll('right')} aria-label={COPY.home.scrollRight} style={scrollBtn}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* ── JOBS LIST ────────────────────────────────────────── */}
      <section style={{ padding: '40px 0 64px', borderTop: '1px solid var(--border)' }}>
        <Container size="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={sectionLabel}>{COPY.home.jobsSectionLabel}</p>
              <h2 className="font-display" style={sectionTitle}>
                {COPY.home.jobsSectionTitle}
              </h2>
            </div>
            <Link to="/jobs" style={linkStyle}>
              {COPY.home.viewAll} <ArrowRight size={13} />
            </Link>
          </div>

          <div className="stagger" style={{ display: 'grid', gap: 10 }}>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 84, borderRadius: 12 }} />
              ))
            ) : jobs.map(j => (
              <JobCard key={j._id} job={j} />
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Button as="a" href="/jobs" variant="ghost" size="md">
              <Briefcase size={14} /> {COPY.home.loadMore}
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display" style={{
        fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600,
        color: 'var(--ink)', letterSpacing: '-0.025em', lineHeight: 1,
      }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.75rem', color: 'var(--ink-muted)',
  letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6,
};
const sectionTitle: React.CSSProperties = {
  fontSize: 'clamp(1.4rem, 3vw, 1.85rem)', fontWeight: 600,
  color: 'var(--ink)', letterSpacing: '-0.025em', lineHeight: 1.1,
};
const linkStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  fontSize: '0.85rem', color: 'var(--ink-muted)',
  textDecoration: 'none', fontWeight: 500,
};
const scrollBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--ink-muted)',
  cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};
