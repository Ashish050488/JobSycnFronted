// FILE: src/components/LeaderboardRow.tsx
import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export interface LeaderboardCompany {
  company: string;
  domain?: string;
  newThisWeek: number;
  totalRoles: number;
  avgAgeDays: number;
  stalePercent: number;
  signal: 'hot' | 'active' | 'steady' | 'stale';
  weekOverWeek?: number;
  careersUrl?: string;
}

export interface SignalConfig {
  label: string;
  color: string;
  bg: string;
  dot: string;
}

interface Props {
  rank: number;
  company: LeaderboardCompany;
  signalConfig: SignalConfig;
  maxNew: number;
}

export default function LeaderboardRow({ rank, company, signalConfig, maxNew }: Props) {
  const [open, setOpen] = useState(false);
  const barPct = maxNew > 0 ? Math.min(100, Math.round((company.newThisWeek / maxNew) * 100)) : 0;

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 11,
      transition: 'border-color 160ms ease',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'grid',
          gridTemplateColumns: '32px minmax(0, 1fr) auto auto auto 26px',
          gap: 12,
          alignItems: 'center',
          width: '100%',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          color: 'var(--ink)',
        }}
      >
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: 'var(--ink-faint)',
          fontVariantNumeric: 'tabular-nums',
        }}>#{rank}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <CompanyLogo name={company.company} domain={company.domain} size={32} borderRadius={9} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--ink)',
              letterSpacing: '-0.012em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{company.company}</div>
            <div style={{
              fontSize: '0.7rem',
              color: signalConfig.color,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 1,
              fontWeight: 500,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: signalConfig.dot,
              }} />
              {signalConfig.label}
            </div>
          </div>
        </div>

        <div style={{ minWidth: 90, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            flex: 1, height: 5, borderRadius: 999,
            background: 'var(--paper-2)',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${barPct}%`,
              height: '100%',
              background: signalConfig.color,
              borderRadius: 999,
            }} />
          </div>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--accent)',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 22,
            textAlign: 'right',
          }}>+{company.newThisWeek}</span>
        </div>

        <span style={{
          fontSize: '0.82rem', color: 'var(--ink-muted)',
          fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right',
        }}>{company.totalRoles}</span>
        <span style={{
          fontSize: '0.72rem', color: 'var(--ink-faint)',
          fontVariantNumeric: 'tabular-nums', minWidth: 56, textAlign: 'right',
        }}>{company.avgAgeDays}d avg</span>

        <ChevronDown
          size={14}
          style={{
            color: 'var(--ink-faint)',
            transition: 'transform 200ms ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div style={{
          padding: '0 14px 14px',
          borderTop: '1px solid var(--border)',
          marginTop: 4,
          paddingTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: 8,
          }}>
            <Stat label="Avg posting age" value={`${company.avgAgeDays} days`} />
            <Stat label="Stale roles" value={`${company.stalePercent}%`} />
            {typeof company.weekOverWeek === 'number' && (
              <Stat label="Week over week" value={`${company.weekOverWeek > 0 ? '+' : ''}${company.weekOverWeek}`} />
            )}
          </div>
          {company.careersUrl && (
            <a
              href={company.careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                background: 'var(--ink)',
                color: 'var(--paper)',
                textDecoration: 'none',
                borderRadius: 9,
                fontSize: '0.82rem',
                fontWeight: 500,
                alignSelf: 'flex-start',
              }}
            >
              View open roles <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '8px 10px', background: 'var(--paper-2)', borderRadius: 8 }}>
      <div style={{ fontSize: '0.66rem', color: 'var(--ink-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--ink)', fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}
