// FILE: src/pages/Home.tsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import JobCard from '../components/JobCard';
import CompanyCard from '../components/DirectoryCard';
import MarketPulse from '../components/MarketPulse';
import type { IJob, ICompany } from '../types';
import { Button, Badge, Container } from '../components/ui';
import { BRAND, COPY } from '../theme/brand';
import { useUser } from '../context/UserContext';

export default function Home() {
  const { currentUser } = useUser();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `${BRAND.fullName} | ${BRAND.tagline}`;
    (async () => {
      try {
        const [jr, dr] = await Promise.all([fetch('/api/jobs?limit=9'), fetch('/api/jobs/directory')]);
        const jd: { jobs?: IJob[] } = await jr.json();
        setJobs(jd.jobs ?? []);
        const dd: unknown = await dr.json();
        if (Array.isArray(dd)) setCompanies(dd.slice(0, 8) as ICompany[]);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = viewportWidth < 640;
  const isTablet = viewportWidth < 1024;

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollStep = isMobile ? Math.max(viewportWidth - 72, 220) : 300;
    carouselRef.current.scrollBy({ left: dir === 'left' ? -scrollStep : scrollStep, behavior: 'smooth' });
  };

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div className="orb" style={{ width: 500, height: 500, top: -200, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-soft)' }} />
        <Container style={{ position: 'relative', zIndex: 1, paddingTop: isMobile ? 72 : 96, paddingBottom: isMobile ? 56 : 80, textAlign: 'center' }}>
          <div className="anim-up" style={{ marginBottom: 20 }}><Badge variant="primary"><Briefcase size={10} />{COPY.home.heroLabel}</Badge></div>
          <h1 className="anim-up" style={{ animationDelay: '0.07s', fontSize: 'clamp(2.4rem,6.5vw,4.5rem)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            {COPY.home.heroTitle1}<br /><span className="font-sketch" style={{ color: 'var(--primary)', fontSize: '1.1em' }}>{COPY.home.heroTitle2}</span>
          </h1>
          <p className="anim-up" style={{ animationDelay: '0.14s', fontSize: isMobile ? '0.95rem' : '1.05rem', color: 'var(--muted-ink)', lineHeight: 1.75, maxWidth: 500, margin: '0 auto 36px' }}>
            {COPY.home.heroSubtitle}
          </p>
          <div className="anim-up hero-cta-row" style={{ animationDelay: '0.2s', display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="w-full sm:w-auto"><Link to="/jobs" className="block w-full"><Button size="lg" className="w-full">{COPY.home.heroCTA} <ArrowRight size={15} /></Button></Link></div>
            <div className="w-full sm:w-auto"><Link to="/directory" className="block w-full"><Button variant="ghost" size="lg" className="w-full">{COPY.home.heroSecondaryCTA}</Button></Link></div>
          </div>
          <div className="anim-up hero-stats-row" style={{ animationDelay: '0.28s', display: 'flex', justifyContent: 'center', gap: 'clamp(24px, 8vw, 48px)', marginTop: 'clamp(30px, 8vw, 60px)', flexWrap: 'wrap', paddingTop: 'clamp(20px, 6vw, 40px)', borderTop: '1.25px solid var(--border)' }}>
            {[[COPY.home.stat1Value, COPY.home.stat1Label], [COPY.home.stat2Value, COPY.home.stat2Label]].map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center', minWidth: 120 }}>
                <div className="font-sketch" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700, color: 'var(--primary)' }}>{v}</div>
                <div style={{ fontSize: '0.78rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--subtle-ink)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── COMPANIES ────────────────────────────────── */}
      <section style={{ padding: isMobile ? '56px 0' : '80px 0', background: 'var(--surface-solid)', borderTop: '1.25px solid var(--border)' }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', marginBottom: isMobile ? 24 : 36, flexWrap: 'wrap', gap: 14 }}>
            <div>
              <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>{COPY.home.companiesSectionLabel}</p>
              <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--ink)' }}>{COPY.home.companiesSectionTitle1} <span style={{ color: 'var(--primary)' }}>{COPY.home.companiesSectionTitle2}</span></h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end', flexWrap: 'wrap' }}>
              {isMobile ? (
                <span style={{ fontSize: '0.76rem', color: 'var(--muted-ink)' }}>Swipe to explore companies</span>
              ) : (
                <>
                  <button onClick={() => scrollCarousel('left')} aria-label={COPY.home.scrollLeft}
                    style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)', transition: 'all 0.22s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => scrollCarousel('right')} aria-label={COPY.home.scrollRight}
                    style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)', transition: 'all 0.22s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)'; }}>
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              <Link to="/directory" style={{ width: isMobile ? '100%' : 'auto' }}><Button variant="ghost" style={{ width: isMobile ? '100%' : undefined }}>{COPY.home.fullDirectory} <ArrowRight size={13} /></Button></Link>
            </div>
          </div>

          <div ref={carouselRef} className="snap-carousel stagger" style={{ scrollPaddingLeft: 4 }}>
            {companies.map(c => (
              <div key={c.companyName} style={{ minWidth: isMobile ? '82vw' : isTablet ? '42vw' : '280px', maxWidth: isMobile ? 340 : 300, flex: '0 0 auto' }}>
                <CompanyCard company={c} />
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── MARKET PULSE ─────────────────────────────── */}
      {currentUser && <MarketPulse />}
      {!currentUser && (
        <section style={{ padding: isMobile ? '56px 0' : '80px 0', background: 'var(--paper)', borderTop: '1.25px solid var(--border)' }}>
          <Container>
            <div style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
              <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 12 }}>Market Insights</p>
              <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--ink)', marginBottom: 16 }}>
                Track Hiring Trends
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--muted-ink)', marginBottom: 24 }}>
                Sign in to access real-time market pulse data — see which roles are hot, trending skills, and salary insights.
              </p>
              <Link to="/login" style={{ display: 'inline-block', width: isMobile ? '100%' : 'auto' }}><Button size="lg" style={{ width: isMobile ? '100%' : undefined }}>Sign In to View Market Insights</Button></Link>
            </div>
          </Container>
        </section>
      )}

      {/* ── LATEST JOBS ──────────────────────────────── */}
      <section style={{ padding: isMobile ? '56px 0' : '80px 0', background: 'var(--paper)', borderTop: '1.25px solid var(--border)' }}>
        <Container size="lg">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end', marginBottom: isMobile ? 24 : 32, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>{COPY.home.jobsSectionLabel}</p>
              <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--ink)' }}>{COPY.home.jobsSectionTitle}</h2>
            </div>
            <Link to="/jobs" style={{ width: isMobile ? '100%' : 'auto' }}><Button variant="ghost" style={{ width: isMobile ? '100%' : undefined }}>{COPY.home.viewAll} <ArrowRight size={13} /></Button></Link>
          </div>
          {loading ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 140 }} />)}</div>
            : <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{jobs.map(j => <JobCard key={j._id} job={j} />)}</div>}
          <div style={{ textAlign: 'center', marginTop: 36 }}><Link to="/jobs" style={{ display: 'inline-block', width: isMobile ? '100%' : 'auto' }}><Button variant="outline" style={{ width: isMobile ? '100%' : undefined }}>{COPY.home.loadMore} <ArrowRight size={13} /></Button></Link></div>
        </Container>
      </section>

      {/* ── Privacy & Terms link (required for Google verification) ── */}
    </div>
  );
}
