import { Eye, EyeOff, Sparkles, GraduationCap, X } from 'lucide-react';
import type { AppUser } from '../context/UserContext';

interface ActiveFilter {
  label: string;
  clear: () => void;
}

interface DashboardMobileFiltersProps {
  isXsSm: boolean;
  activeFilterCount: number;
  currentUser: AppUser | null;
  newJobsCount: number;
  hideApplied: boolean;
  entryLevelFilter: boolean;
  showNewOnly: boolean;
  activeMobileFilters: ActiveFilter[];
  activeChipStyle: React.CSSProperties;
  pillStyle: (active: boolean) => React.CSSProperties;
  setFilterModalOpen: (open: boolean) => void;
  setHideApplied: (fn: (h: boolean) => boolean) => void;
  setEntryLevelFilter: (fn: (f: boolean) => boolean) => void;
  setShowNewOnly: (fn: (n: boolean) => boolean) => void;
  clearAllFilters: () => void;
}

export function DashboardMobileFilters({
  isXsSm, activeFilterCount, currentUser, newJobsCount,
  hideApplied, entryLevelFilter, showNewOnly,
  activeMobileFilters, activeChipStyle, pillStyle,
  setFilterModalOpen, setHideApplied, setEntryLevelFilter, setShowNewOnly,
  clearAllFilters,
}: DashboardMobileFiltersProps) {
  return (
    <div style={{ padding: '10px 0 14px', marginBottom: 8 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isXsSm ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
          gap: 8,
          padding: 10,
          borderRadius: 18,
          border: '1px solid var(--border)',
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary-soft) 16%, transparent), color-mix(in srgb, var(--surface-solid) 90%, transparent))',
        }}
      >
        <button
          onClick={() => setFilterModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 14,
            border: activeFilterCount > 0 ? '1.5px solid var(--primary)' : '1.25px solid var(--border)',
            background: activeFilterCount > 0 ? 'var(--primary-soft)' : 'var(--surface-solid)',
            color: activeFilterCount > 0 ? 'var(--primary)' : 'var(--ink)',
            cursor: 'pointer',
            fontSize: '0.86rem',
            fontFamily: 'inherit',
            fontWeight: 700,
            transition: 'all 0.18s',
            gridColumn: '1 / -1',
            textAlign: 'left',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ width: 34, height: 34, borderRadius: 12, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block' }}>Browse filters</span>
              <span style={{ display: 'block', marginTop: 2, fontSize: '0.72rem', fontWeight: 500, color: activeFilterCount > 0 ? 'var(--primary)' : 'var(--muted-ink)' }}>
                {activeFilterCount > 0 ? `${activeFilterCount} active right now` : 'Role, date, board, company, and more'}
              </span>
            </span>
          </span>
          <span style={{ fontSize: '0.9rem', color: activeFilterCount > 0 ? 'var(--primary)' : 'var(--subtle-ink)' }}>Open</span>
        </button>

        {currentUser && (
          <button
            onClick={() => setHideApplied(h => !h)}
            style={{
              ...pillStyle(hideApplied),
              padding: '11px 12px',
              borderRadius: 14,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {hideApplied ? <><EyeOff size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Hidden</> : <><Eye size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Applied</>}
          </button>
        )}

        <button
          onClick={() => setEntryLevelFilter(f => !f)}
          style={{
              ...pillStyle(entryLevelFilter),
              padding: '11px 12px',
              borderRadius: 14,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
          }}
        >
          <GraduationCap size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Fresher
        </button>

        {currentUser && newJobsCount > 0 && (
          <button
            onClick={() => setShowNewOnly(n => !n)}
            style={{
              ...pillStyle(showNewOnly),
              padding: '11px 12px',
              borderRadius: 14,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={13} style={{ verticalAlign: -2, marginRight: 6 }} />New
          </button>
        )}
      </div>

      {activeMobileFilters.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {activeMobileFilters.map(filter => (
            <button key={filter.label} onClick={filter.clear} style={activeChipStyle}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{filter.label}</span>
              <X size={11} style={{ marginLeft: 4, flexShrink: 0 }} />
            </button>
          ))}
          <button onClick={clearAllFilters} style={{ ...activeChipStyle, background: 'transparent', border: '1px dashed var(--border)', color: 'var(--muted-ink)' }}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
