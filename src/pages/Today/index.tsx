// FILE: src/pages/Today/index.tsx
// Personalized home for logged-in users. Composes Hero + (Picks + News) + Sidebar.

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { Container } from '../../components/ui';
import type { IJob } from '../../types';
import { buildSkillsRegex } from '../../components/JobDetailPanel';
import { BRAND } from '../../theme/brand';
import Hero from './Hero';
import PicksSection from './PicksSection';
import NewsSection from './NewsSection';
import Sidebar from './Sidebar';
import type { LeaderboardCompany } from './shared';

export default function Today() {
  const { currentUser, userSkills, todayCount, dailyGoal, openSkillsEditor, saveDailyGoal } = useUser();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [topCompanies, setTopCompanies] = useState<LeaderboardCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 900 : true);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { document.title = `Today · ${BRAND.appName}`; }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/jobs?limit=40').then(r => r.ok ? r.json() : { jobs: [] }),
      fetch('/api/jobs/hiring-leaderboard').then(r => r.ok ? r.json() : { companies: [] }),
    ]).then(([j, lb]) => {
      if (cancelled) return;
      setJobs((j?.jobs || j || []).slice(0, 40));
      const cs = lb?.companies || lb?.data || lb || [];
      setTopCompanies(Array.isArray(cs) ? cs.slice(0, 3) : []);
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
    <Container size="xl" style={{ paddingTop: 'clamp(24px, 5vw, 40px)', paddingBottom: 60 }}>
      <Hero
        isDesktop={isDesktop}
        greeting={greeting()}
        firstName={firstName}
        todayCount={todayCount}
        dailyGoal={dailyGoal}
        onGoalChange={saveDailyGoal}
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'minmax(0, 2fr) minmax(0, 1fr)' : '1fr',
        gap: 28, alignItems: 'start',
      }}>
        {/* Left column: picks + news widget (news fills the space the removed
            stat boxes left behind, balancing the column heights). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 }}>
          <PicksSection
            picks={picks}
            loading={loading}
            userSkillsLength={userSkills.length}
            onOpenSkillsEditor={openSkillsEditor}
          />
          <NewsSection />
        </div>
        <Sidebar isDesktop={isDesktop} loading={loading} topCompanies={topCompanies} />
      </div>
    </Container>
  );
}
