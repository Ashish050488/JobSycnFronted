import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Minus,
  ChevronRight, ExternalLink, MapPin, Briefcase,
} from 'lucide-react';
import { Badge } from './ui';

interface LeaderboardCompany {
  rank: number;
  company: string;
  totalActiveRoles: number;
  newThisWeek: number;
  newLastWeek: number;
  delta: number;
  trend: 'up' | 'down' | 'stable';
  hiringSignal: 'hot' | 'active' | 'steady' | 'stale';
  staleRoles: number;
  staleRatio: number;
  avgAgeDays: number;
  cities: string[];
  topRoles: string[];
  mostRecentJobDate: string | null;
}

interface SignalConfig {
  label: string; icon: React.ReactNode; color: string; bg: string; border: string;
}

interface Props {
  company: LeaderboardCompany;
  isMobile: boolean;
  isTablet: boolean;
  expanded: boolean;
  onToggle: () => void;
  signalConfig: Record<string, SignalConfig>;
  labels: {
    colNew: string; colTotal: string; colAge: string; colStale: string;
    expandedWoW: string; expandedViewRoles: string;
  };
  maxRoles: number;
}

// Bar gradient per signal type
const BAR_GRADIENTS: Record<string, string> = {
  hot: 'linear-gradient(90deg, #ea580c, #f59e0b)',
  active: 'linear-gradient(90deg, var(--primary), #34d399)',
  steady: 'linear-gradient(90deg, var(--border-strong), var(--muted-ink))',
  stale: 'linear-gradient(90deg, var(--warning), rgba(251,191,36,0.3))',
};

export function LeaderboardRow({
  company: c, isMobile, isTablet, expanded, onToggle, signalConfig, labels, maxRoles,
}: Props) {
  const signal = signalConfig[c.hiringSignal];
  const barPercent = Math.max(4, Math.round((c.totalActiveRoles / maxRoles) * 100));
  const isTop3 = c.rank <= 3;

  return (
    <div
      onClick={onToggle}
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--paper2)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Main row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile
          ? '28px 1fr 52px'
          : isTablet
            ? '32px 1fr 52px 46px 20px'
            : '36px 1fr 56px 50px 70px 54px 20px',
        alignItems: 'center',
        gap: isMobile ? 8 : 12,
        padding: isMobile ? '10px 12px' : '10px 16px',
        minHeight: isMobile ? 52 : 48,
      }}>
        {/* Rank */}
        <span style={{
          fontWeight: 800,
          fontSize: isTop3 ? '0.95rem' : '0.8rem',
          color: isTop3 ? 'var(--primary)' : 'var(--subtle-ink)',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
        }}>
          {c.rank}
        </span>

        {/* Company name + bar + signal */}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 4,
          }}>
            <span style={{
              fontWeight: isTop3 ? 800 : 600,
              fontSize: isMobile ? '0.82rem' : '0.85rem',
              color: 'var(--ink)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: isMobile ? '130px' : '220px',
            }}>
              {c.company}
            </span>
            {/* Signal dot */}
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: signal.color, flexShrink: 0,
              boxShadow: c.hiringSignal === 'hot' ? `0 0 6px ${signal.color}` : 'none',
            }} />
            {!isMobile && (
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, color: signal.color,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {signal.label}
              </span>
            )}
            {/* Delta chip */}
            {c.delta !== 0 && !isMobile && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 2,
                fontSize: '0.62rem', fontWeight: 700,
                color: c.delta > 0 ? 'var(--success)' : 'var(--danger)',
                padding: '1px 5px', borderRadius: 4,
                background: c.delta > 0 ? 'var(--success-soft)' : 'var(--danger-soft)',
              }}>
                {c.delta > 0 ? '↑' : '↓'}{Math.abs(c.delta)}
              </span>
            )}
          </div>
          {/* Progress bar — hiring volume visualization */}
          <div style={{
            height: isMobile ? 4 : 5,
            background: 'var(--border)',
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${barPercent}%`,
              background: BAR_GRADIENTS[c.hiringSignal] || BAR_GRADIENTS.steady,
              borderRadius: 3,
              transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              ...(isTop3 ? {
                boxShadow: `0 0 8px color-mix(in srgb, ${signal.color} 40%, transparent)`,
              } : {}),
            }} />
          </div>
          {/* Cities — tiny, inline */}
          {!isMobile && c.cities.length > 0 && (
            <div style={{
              fontSize: '0.62rem', color: 'var(--subtle-ink)',
              marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {c.cities.slice(0, 3).join(' · ')}{c.cities.length > 3 ? ` +${c.cities.length - 3}` : ''}
            </div>
          )}
        </div>

        {/* New this week */}
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontWeight: 800, fontSize: '0.9rem',
            color: c.newThisWeek > 0 ? 'var(--primary)' : 'var(--subtle-ink)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {c.newThisWeek > 0 ? `+${c.newThisWeek}` : '0'}
          </span>
          {isMobile && (
            <div style={{ fontSize: '0.58rem', color: 'var(--subtle-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {labels.colNew}
            </div>
          )}
        </div>

        {/* Total */}
        {!isMobile && (
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontWeight: 600, fontSize: '0.82rem', color: 'var(--muted-ink)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {c.totalActiveRoles}
            </span>
          </div>
        )}

        {/* Avg age — desktop */}
        {!isTablet && (
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontWeight: 600, fontSize: '0.78rem',
              color: c.avgAgeDays > 21 ? 'var(--warning)' : 'var(--subtle-ink)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {c.avgAgeDays}d
            </span>
          </div>
        )}

        {/* Stale — desktop */}
        {!isTablet && (
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontWeight: 600, fontSize: '0.78rem',
              color: c.staleRatio > 50 ? 'var(--danger)' : c.staleRatio > 25 ? 'var(--warning)' : 'var(--subtle-ink)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {c.staleRatio}%
            </span>
          </div>
        )}

        {/* Chevron */}
        {!isMobile && (
          <ChevronRight
            size={14}
            color="var(--subtle-ink)"
            style={{
              transition: 'transform 0.2s',
              transform: expanded ? 'rotate(90deg)' : 'none',
            }}
          />
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: isMobile ? '8px 12px 14px 48px' : '6px 16px 14px 60px',
          background: 'var(--paper2)',
          borderTop: '1px solid var(--border)',
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        }}>
          {/* Week over week trend */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: '0.75rem', color: 'var(--muted-ink)',
          }}>
            {labels.expandedWoW}
            <strong style={{
              color: c.delta > 0 ? 'var(--success)' : c.delta < 0 ? 'var(--danger)' : 'var(--muted-ink)',
              display: 'inline-flex', alignItems: 'center', gap: 2,
            }}>
              {c.delta > 0 ? <TrendingUp size={12} /> : c.delta < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
              {c.delta > 0 ? '+' : ''}{c.delta}
            </strong>
          </span>

          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />

          {/* Last week */}
          <span style={{ fontSize: '0.72rem', color: 'var(--subtle-ink)' }}>
            Last wk: <strong style={{ color: 'var(--muted-ink)' }}>+{c.newLastWeek}</strong>
          </span>

          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />

          {/* Top roles as compact badges */}
          {c.topRoles.slice(0, 3).map(role => (
            <Badge key={role} variant="primary" style={{ fontSize: '0.66rem', padding: '2px 7px' }}>
              <Briefcase size={9} /> {role}
            </Badge>
          ))}
          {c.cities.length > 0 && (
            <Badge variant="neutral" style={{ fontSize: '0.66rem', padding: '2px 7px' }}>
              <MapPin size={9} /> {c.cities[0]}{c.cities.length > 1 ? ` +${c.cities.length - 1}` : ''}
            </Badge>
          )}

          {/* CTA */}
          <Link
            to={`/jobs?company=${encodeURIComponent(c.company)}`}
            onClick={e => e.stopPropagation()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 8, marginLeft: 'auto',
              background: 'var(--primary)', color: '#fff',
              textDecoration: 'none', fontWeight: 700, fontSize: '0.72rem',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {labels.expandedViewRoles} ({c.totalActiveRoles}) <ExternalLink size={10} />
          </Link>
        </div>
      )}
    </div>
  );
}
