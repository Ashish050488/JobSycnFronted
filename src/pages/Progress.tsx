import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, ExternalLink } from 'lucide-react';

import ProgressRing from '../components/ProgressRing';
import ActivityChart from '../components/ActivityChart';
import { Badge, Button, Container, EmptyState, PageHeader } from '../components/ui';
import { useUser } from '../context/UserContext';
import { COPY } from '../theme/brand';
import type { AppliedJobDetail } from '../types';
import { formatAppliedRelativeTime, getGoalMetDays, getThisWeekApplied } from '../utils/progress';

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);

  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);

  return mobile;
}

export default function Progress() {
  const isMobile = useIsMobile();
  const { currentUser, appliedJobs, todayCount, streak, dailyGoal, saveDailyGoal } = useUser();
  const [recentApplied, setRecentApplied] = useState<AppliedJobDetail[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    document.title = COPY.site.documentTitleProgress;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setRecentApplied([]);
      setLoadingRecent(false);
      return;
    }

    let cancelled = false;
    setLoadingRecent(true);

    fetch(`/api/users/${encodeURIComponent(currentUser.slug)}/applied/details`)
      .then(response => response.ok ? response.json() : [])
      .then((data: AppliedJobDetail[]) => {
        if (!cancelled) {
          setRecentApplied(Array.isArray(data) ? data.slice(0, 20) : []);
        }
      })
      .catch(() => {
        if (!cancelled) setRecentApplied([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecent(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.slug, appliedJobs]);

  const goalMetDays = useMemo(() => getGoalMetDays(appliedJobs, dailyGoal, 7), [appliedJobs, dailyGoal]);
  const thisWeekApplied = useMemo(() => getThisWeekApplied(appliedJobs), [appliedJobs]);

  if (!currentUser) {
    return <Navigate to="/jobs" replace />;
  }

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <Container style={{ padding: isMobile ? '24px 24px 40px' : '32px 24px 48px' }}>
        <PageHeader
          label={COPY.progress.pageLabel}
          title={COPY.progress.pageTitle}
          subtitle={`Hey, ${currentUser.name} 👋`}
          actions={
            <Link to="/jobs" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm"><ArrowLeft size={14} />{COPY.progress.backToJobs}</Button>
            </Link>
          }
        />

        <div style={{ display: 'grid', gap: 20 }}>
          <section style={{ background: 'linear-gradient(180deg, rgba(45,106,79,0.08), transparent 70%), var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 18, padding: isMobile ? '22px 18px' : '26px 28px' }}>
            <div style={{ display: 'flex', gap: isMobile ? 18 : 24, alignItems: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
              <ProgressRing todayCount={todayCount} dailyGoal={dailyGoal} onGoalChange={saveDailyGoal} size={80} />
              <div style={{ flex: 1, minWidth: 0, textAlign: isMobile ? 'center' : 'left' }}>
                <div className="font-sketch" style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: 4 }}>{COPY.progress.todayLabel}</div>
                <div style={{ fontSize: isMobile ? '1.7rem' : '2rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>{todayCount} applied today</div>
                <div style={{ fontSize: '0.92rem', color: 'var(--muted-ink)', marginTop: 6 }}>Goal: {dailyGoal}/day</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Badge variant={streak > 0 ? 'yellow' : 'neutral'} style={{ fontSize: '0.92rem', padding: '8px 14px', borderRadius: 999 }}>
                  {streak > 0 ? `🔥 ${streak}-day streak` : COPY.progress.noStreak}
                </Badge>
              </div>
            </div>
          </section>

          <section>
            <ActivityChart appliedJobs={appliedJobs} dailyGoal={dailyGoal} isMobile={isMobile} barMaxHeight={120} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 18px', marginTop: 12, padding: '0 4px', fontSize: '0.86rem', color: 'var(--muted-ink)' }}>
              <span>⭐ Hit goal {goalMetDays} of last 7 days</span>
              <span>Applied to {thisWeekApplied} jobs this week</span>
            </div>
          </section>

          <section style={{ background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div className="font-sketch" style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: 4 }}>{COPY.progress.historyLabel}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted-ink)' }}>{COPY.progress.historySubtitle}</div>
              </div>
            </div>

            {loadingRecent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 20 }}>
                {[1, 2, 3, 4].map(index => <div key={index} className="skeleton" style={{ height: 56, borderRadius: 12 }} />)}
              </div>
            ) : recentApplied.length === 0 ? (
              <div style={{ padding: 20 }}>
                <EmptyState icon={<BriefcaseBusiness size={34} />} title={COPY.progress.emptyTitle} body={COPY.progress.emptyBody} />
              </div>
            ) : (
              <div>
                {recentApplied.map(entry => {
                  const row = (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '14px 20px', borderTop: '1px solid var(--border)', color: 'inherit', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{entry.jobTitle}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted-ink)', marginTop: 4 }}>{entry.company}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-ink)', fontSize: '0.8rem', flexShrink: 0 }}>
                        <span>{formatAppliedRelativeTime(entry.appliedAt)}</span>
                        {entry.applicationURL && <ExternalLink size={13} />}
                      </div>
                    </div>
                  );

                  if (!entry.applicationURL && entry.jobTitle === 'Job no longer available') {
                    return <div key={`${entry.jobId}-${entry.appliedAt}`}>{row}</div>;
                  }

                  return (
                    <Link key={`${entry.jobId}-${entry.appliedAt}`} to={`/jobs?selectedJob=${encodeURIComponent(entry.jobId)}`} style={{ display: 'block', textDecoration: 'none' }}>
                      {row}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </Container>
    </div>
  );
}