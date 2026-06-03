// FILE: src/pages/Today/Hero.tsx
import { Flame, Briefcase, Target } from 'lucide-react';
import ProgressRing from '../../components/ProgressRing';
import { eyebrowStyle, MiniStat } from './shared';

interface Props {
  isDesktop: boolean;
  greeting: string;
  firstName: string;
  todayCount: number;
  dailyGoal: number;
  streak: number;
  appliedCount: number;
  onGoalChange: (n: number) => void;
}

export default function Hero({ isDesktop, greeting, firstName, todayCount, dailyGoal, streak, appliedCount, onGoalChange }: Props) {
  return (
    <div
      className="anim-up"
      style={{
        display: 'grid',
        gridTemplateColumns: isDesktop ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr',
        gap: 24, alignItems: 'stretch', marginBottom: 32,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p style={eyebrowStyle}>{greeting}</p>
        <h1 className="font-display" style={{
          fontSize: 'clamp(1.85rem, 5vw, 2.6rem)', fontWeight: 600,
          color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1.1,
        }}>{firstName}.</h1>
        <p style={{ color: 'var(--ink-muted)', marginTop: 8, fontSize: '1rem', lineHeight: 1.55 }}>
          {todayCount > 0
            ? `You've applied to ${todayCount} role${todayCount === 1 ? '' : 's'} today.`
            : "Let's get a few applications out today."}
        </p>
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: 'clamp(16px, 3vw, 22px)',
      }}>
        <ProgressRing todayCount={todayCount} dailyGoal={dailyGoal} onGoalChange={onGoalChange} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)',
        }}>
          <MiniStat icon={<Flame size={14} />} value={streak} label="Day streak" accent={streak > 0 ? 'warning' : 'neutral'} />
          <MiniStat icon={<Briefcase size={14} />} value={appliedCount} label="Total applied" accent="neutral" />
          <MiniStat icon={<Target size={14} />} value={`${Math.round((todayCount / Math.max(dailyGoal, 1)) * 100)}%`} label="Daily goal" accent={todayCount >= dailyGoal ? 'success' : 'neutral'} />
        </div>
      </div>
    </div>
  );
}
