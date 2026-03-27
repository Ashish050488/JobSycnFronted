import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Check, X } from 'lucide-react';

import { Button, Container, PageHeader } from '../components/ui';
import { useUser } from '../context/UserContext';
import { COPY } from '../theme/brand';
import type { AppliedJobDetail } from '../types';

import HeatmapCalendar from '../components/HeatmapCalendar';
import FunnelChart from '../components/FunnelChart';
import PipelineView from '../components/PipelineView';
import type { PipelineJob } from '../components/PipelineView';

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return mobile;
}

/* ─── SVG Progress Ring ──────────────────────────────────── */
function ProgressRing({ size, progress, color }: { size: number; progress: number; color: string }) {
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - Math.min(progress, 1) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--border)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function Progress() {
  const isMobile = useIsMobile();
  const { currentUser, appliedJobs, todayCount, streak, dailyGoal, saveDailyGoal, updateStage } = useUser();
  const [recentApplied, setRecentApplied] = useState<AppliedJobDetail[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Goal editor
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState(dailyGoal);

  useEffect(() => {
    document.title = COPY.site.documentTitleProgress;
  }, []);

  useEffect(() => { setGoalDraft(dailyGoal); }, [dailyGoal]);

  const handleSaveGoal = useCallback(async () => {
    await saveDailyGoal(goalDraft);
    setGoalEditorOpen(false);
  }, [goalDraft, saveDailyGoal]);

  // Fetch enriched applied job details
  useEffect(() => {
    if (!currentUser) {
      setRecentApplied([]);
      setLoadingRecent(false);
      return;
    }

    let cancelled = false;
    setLoadingRecent(true);

    fetch('/api/me/applied/details', { credentials: 'include' })
      .then(response => response.ok ? response.json() : [])
      .then((data: AppliedJobDetail[]) => {
        if (!cancelled) setRecentApplied(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setRecentApplied([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRecent(false);
      });

    return () => { cancelled = true; };
  }, [currentUser?.email, appliedJobs]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const job of recentApplied) {
      const s = job.stage || 'applied';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [recentApplied]);

  const pipelineJobs: PipelineJob[] = useMemo(() => {
    return recentApplied.map(job => ({
      jobId: job.jobId,
      jobTitle: job.jobTitle,
      company: job.company,
      applicationURL: job.applicationURL,
      appliedAt: job.appliedAt,
      location: job.location ?? null,
      department: job.department ?? null,
      stage: job.stage || 'applied',
      stageUpdatedAt: job.stageUpdatedAt || job.appliedAt,
      isListingActive: job.isListingActive ?? true,
    }));
  }, [recentApplied]);

  const handleStageChange = async (jobId: string, newStage: string) => {
    await updateStage(jobId, newStage);
  };

  if (!currentUser) {
    return <Navigate to="/jobs" replace />;
  }

  const goalProgress = dailyGoal > 0 ? todayCount / dailyGoal : 0;
  const ringColor = todayCount > 0 ? (goalProgress >= 1 ? 'var(--success)' : 'var(--primary)') : 'var(--border)';
  const goalPct = dailyGoal > 0 ? Math.min(Math.round(goalProgress * 100), 100) : 0;

  /* card style shared across sections */
  const sectionCard = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'var(--surface-solid)',
    border: '1.25px solid var(--border)',
    borderRadius: 18,
    padding: isMobile ? '18px 14px' : '22px 24px',
    ...extra,
  });

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

          {/* ── Section 0: Today's Snapshot ──────────── */}
          <section style={{
            background: 'linear-gradient(135deg, var(--primary-soft), transparent 60%), var(--surface-solid)',
            border: '1.25px solid var(--border)',
            borderRadius: 18,
            padding: isMobile ? '20px 16px' : '24px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: isMobile ? 16 : 24,
            textAlign: isMobile ? 'center' : 'left',
          }}>
            {/* Progress ring */}
            <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              <ProgressRing size={72} progress={goalProgress} color={ringColor} />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
                  {todayCount}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--muted-ink)', marginTop: 1 }}>
                  {goalPct}%
                </span>
              </div>
            </div>

            {/* Today's stats text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 700,
                color: 'var(--ink)', lineHeight: 1.2,
              }}>
                {todayCount} applied today
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 6,
                justifyContent: isMobile ? 'center' : 'flex-start',
                flexWrap: 'wrap',
              }}>
                {goalEditorOpen ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      min={1} max={50}
                      value={goalDraft}
                      onChange={e => setGoalDraft(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                      style={{
                        width: 52, height: 28, borderRadius: 8,
                        border: '1.25px solid var(--primary)', background: 'var(--surface-solid)',
                        color: 'var(--ink)', textAlign: 'center', fontSize: '0.85rem',
                        fontFamily: 'inherit', outline: 'none',
                      }}
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveGoal(); if (e.key === 'Escape') setGoalEditorOpen(false); }}
                    />
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted-ink)' }}>/day</span>
                    <button onClick={handleSaveGoal} style={{
                      background: 'var(--primary)', color: '#fff', border: 'none',
                      borderRadius: 6, width: 24, height: 24, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={13} />
                    </button>
                    <button onClick={() => { setGoalEditorOpen(false); setGoalDraft(dailyGoal); }} style={{
                      background: 'var(--paper2)', color: 'var(--muted-ink)', border: 'none',
                      borderRadius: 6, width: 24, height: 24, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '0.88rem', color: 'var(--muted-ink)' }}>
                      Goal: {dailyGoal}/day
                    </span>
                    <button
                      onClick={() => setGoalEditorOpen(true)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--primary)', fontSize: '0.78rem', fontFamily: 'inherit',
                        textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: 3,
                        padding: 0,
                      }}
                    >
                      <Pencil size={11} /> Edit
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Streak badge */}
            <div style={{ flexShrink: 0 }}>
              {streak > 0 ? (
                <span style={{
                  background: 'var(--warning-soft)', color: 'var(--warning)',
                  borderRadius: 999, padding: '8px 16px', fontSize: '0.88rem', fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  🔥 {streak}-day streak
                </span>
              ) : (
                <span style={{
                  background: 'var(--paper2)', color: 'var(--muted-ink)',
                  borderRadius: 999, padding: '8px 16px', fontSize: '0.88rem', fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                  {COPY.progress.noStreak}
                </span>
              )}
            </div>
          </section>

          {/* ── Section 1: Heatmap Calendar ──────────── */}
          <section style={sectionCard()}>
            <HeatmapCalendar appliedJobs={appliedJobs} dailyGoal={dailyGoal} />
          </section>

          {/* ── Section 2: Funnel Chart ──────────────── */}
          <section style={sectionCard()}>
            <div className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
              Pipeline overview
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted-ink)', marginBottom: 18 }}>
              How your applications are progressing through stages
            </div>
            {loadingRecent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
              </div>
            ) : (
              <FunnelChart stageCounts={stageCounts} totalApplied={recentApplied.length} />
            )}
          </section>

          {/* ── Section 3: Pipeline View ─────────────── */}
          <section style={sectionCard()}>
            <div className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
              My applications
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted-ink)', marginBottom: 18 }}>
              Track and update your application stages
            </div>
            {loadingRecent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
              </div>
            ) : (
              <PipelineView jobs={pipelineJobs} onStageChange={handleStageChange} />
            )}
          </section>

        </div>
      </Container>
    </div>
  );
}
