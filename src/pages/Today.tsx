// FILE: src/pages/Today.tsx
// Personalized home for logged-in users. Notion-style cards, Apple polish.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Briefcase, Flame, Sparkles, CheckCircle2, Clock,
  Target, TrendingUp, ExternalLink,
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { Container } from '../components/ui';
import ProgressRing from '../components/ProgressRing';
import JobCard from '../components/JobCard';
import CompanyLogo from '../components/CompanyLogo';
import type { IJob, AppliedJobDetail } from '../types';
import { buildSkillsRegex } from '../components/JobDetailPanel';
import { BRAND } from '../theme/brand';

interface LeaderboardCompany {
  company: string;
  domain?: string;
  newThisWeek: number;
  totalRoles: number;
  signal: 'hot' | 'active' | 'steady' | 'stale';
}

export default function Today() {
  const { currentUser, userSkills, todayCount, dailyGoal, streak, openSkillsEditor, saveDailyGoal, appliedCount } = useUser();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [topCompanies, setTopCompanies] = useState<LeaderboardCompany[]>([]);
  const [recentApps, setRecentApps] = useState<AppliedJobDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = `Today · ${BRAND.appName}`; }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/jobs?limit=40').then(r => r.ok ? r.json() : { jobs: [] }),
      fetch('/api/jobs/hiring-leaderboard').then(r => r.ok ? r.json() : { companies: [] }),
      fetch('/api/me/applied/details', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
    ]).then(([j, lb, ra]) => {
      if (cancelled) return;
      setJobs((j?.jobs || j || []).slice(0, 40));
      const cs = lb?.companies || lb?.data || lb || [];
      setTopCompanies(Array.isArray(cs) ? cs.slice(0, 3) : []);
      setRecentApps((Array.isArray(ra) ? ra : []).slice(0, 5));
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Pick top jobs matching skills
  const picks = useMemo(() => {
    const re = buildSkillsRegex(userSkills);
    if (!re) return jobs.slice(0, 4);
    return [...jobs]
      .map(j => {
        const hay = `${j.JobTitle} ${j.DescriptionPlain || ''} ${(j.autoTags?.techStack || []).join(' ')}`;
        const matches = (hay.match(re) || []).length;
        return { job: j, score: matches };
      })
      .sort((a, b) => b.score - a.score)
      .filter(x => x.score > 0)
      .slice(0, 4)
      .map(x => x.job)
      .concat(jobs.slice(0, 4))
      .slice(0, 4);
  }, [jobs, userSkills]);

  const firstName = currentUser?.name?.split(' ')[0] || 'there';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Container size="lg" style={{ paddingTop: 'clamp(24px, 5vw, 40px)', paddingBottom: 60 }}>
      {/* Greeting */}
      <div className="anim-up" style={{ marginBottom: 24 }}>
        <p style={eyebrow}>{greeting()}</p>
        <h1 className="font-display" style={{
          fontSize: 'clamp(1.85rem, 5vw, 2.6rem)',
          fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.03em', lineHeight: 1.1,
        }}>
          {firstName}.
        </h1>
        <p style={{ color: 'var(--ink-muted)', marginTop: 8, fontSize: '1rem', lineHeight: 1.55 }}>
          {todayCount > 0
            ? `You've applied to ${todayCount} role${todayCount === 1 ? '' : 's'} today.`
            : "Let's get a few applications out today."}
        </p>
      </div>

      {/* Progress + Quick stats */}
      <div className="anim-up" style={{ marginBottom: 32 }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 'clamp(16px, 3vw, 22px)',
        }}>
          <ProgressRing todayCount={todayCount} dailyGoal={dailyGoal} onGoalChange={saveDailyGoal} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 10,
            marginTop: 20,
            paddingTop: 18,
            borderTop: '1px solid var(--border)',
          }}>
            <MiniStat icon={<Flame size={14} />} value={streak} label={streak === 1 ? 'Day streak' : 'Day streak'} accent={streak > 0 ? 'warning' : 'neutral'} />
            <MiniStat icon={<Briefcase size={14} />} value={appliedCount} label="Total applied" accent="neutral" />
            <MiniStat icon={<Target size={14} />} value={`${Math.round((todayCount / Math.max(dailyGoal, 1)) * 100)}%`} label="Daily goal" accent={todayCount >= dailyGoal ? 'success' : 'neutral'} />
          </div>
        </div>
      </div>

      {/* Picks for you */}
      <section style={{ marginBottom: 36 }}>
        <SectionHead
          eyebrow={userSkills.length > 0 ? `${userSkills.length} skills` : 'Add your skills'}
          title="Picks for you"
          linkLabel="All jobs"
          linkTo="/jobs"
        />
        {userSkills.length === 0 && (
          <div style={{
            marginBottom: 12,
            padding: '11px 14px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-mid)',
            borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 10, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={13} /> Add skills to get better matches in the feed
            </span>
            <button onClick={openSkillsEditor} style={{
              padding: '6px 13px', borderRadius: 8,
              background: 'var(--accent)', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500,
            }}>Add skills</button>
          </div>
        )}
        <div className="stagger" style={{ display: 'grid', gap: 10 }}>
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />
            ))
          ) : picks.length === 0 ? (
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', padding: 16, textAlign: 'center' }}>
              No jobs available right now.
            </p>
          ) : (
            picks.map(j => <JobCard key={j._id} job={j} />)
          )}
        </div>
      </section>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
      }}>
        {/* Companies hiring fast */}
        <section>
          <SectionHead
            eyebrow="Live signal"
            title="Hiring fast this week"
            linkLabel="See all"
            linkTo="/hiring"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />
              ))
            ) : topCompanies.length === 0 ? (
              <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem' }}>No data yet.</p>
            ) : (
              topCompanies.map((c, i) => (
                <Link key={c.company} to="/hiring" style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 11,
                  textDecoration: 'none',
                  transition: 'all 160ms ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-faint)',
                    width: 22, textAlign: 'center', flexShrink: 0,
                  }}>#{i + 1}</span>
                  <CompanyLogo name={c.company} domain={c.domain} size={32} borderRadius={9} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>{c.company}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={10} /> +{c.newThisWeek} new this week
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Recent applications */}
        <section>
          <SectionHead
            eyebrow="Your activity"
            title="Recent applications"
            linkLabel="Track all"
            linkTo="/progress"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 52, borderRadius: 11 }} />
              ))
            ) : recentApps.length === 0 ? (
              <div style={{
                padding: '20px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                textAlign: 'center',
              }}>
                <CheckCircle2 size={20} style={{ color: 'var(--ink-faint)', marginBottom: 8 }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
                  No applications yet. Apply to a job to start tracking.
                </p>
              </div>
            ) : (
              recentApps.map(a => (
                <a key={a.jobId}
                  href={a.applicationURL || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 11,
                    textDecoration: 'none',
                  }}
                >
                  <CompanyLogo name={a.company} size={28} borderRadius={8} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{a.jobTitle}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 1, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {a.company}
                    </div>
                  </div>
                  <ExternalLink size={12} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
                </a>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Suppress unused */}
      
    </Container>
  );
}

function SectionHead({ eyebrow, title, linkLabel, linkTo }: { eyebrow: string; title: string; linkLabel: string; linkTo: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
      <div>
        <p style={eyebrow as any}>{eyebrow}</p>
        <h2 className="font-display" style={{
          fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.02em',
        }}>{title}</h2>
      </div>
      <Link to={linkTo} style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: '0.82rem', color: 'var(--ink-muted)',
        textDecoration: 'none', fontWeight: 500,
      }}>{linkLabel} <ArrowRight size={12} /></Link>
    </div>
  );
}

function MiniStat({ icon, value, label, accent }: { icon: React.ReactNode; value: React.ReactNode; label: string; accent: 'success' | 'warning' | 'neutral' }) {
  const color = accent === 'success' ? 'var(--success)' : accent === 'warning' ? 'var(--warning)' : 'var(--ink-muted)';
  const bg = accent === 'success' ? 'var(--success-soft)' : accent === 'warning' ? 'var(--warning-soft)' : 'var(--paper-2)';
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--paper-2)',
      borderRadius: 10,
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 6,
          background: bg, color,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</span>
        <span style={{
          fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
        }}>{value}</span>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 3 }}>{label}</p>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: '0.75rem', color: 'var(--ink-muted)',
  letterSpacing: '0.05em', textTransform: 'uppercase',
  fontWeight: 600, marginBottom: 6,
};
