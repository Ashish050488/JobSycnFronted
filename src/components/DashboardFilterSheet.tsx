import { X } from 'lucide-react';
import type { ICompany } from '../types';

interface FilterOption {
  label: string;
  value: string | null;
}

interface DashboardFilterSheetProps {
  // Filter state
  roleCategoryFilter: string | null;
  experienceBandFilter: string | null;
  workplaceFilter: string | null;
  dateFilter: string | null;
  platformFilter: string | null;
  sel: string;
  activeFilterCount: number;
  visibleJobsCount: number;
  cos: ICompany[];
  roleOptions: readonly FilterOption[];
  experienceOptions: readonly FilterOption[];
  // Handlers
  setRoleCategoryFilter: (v: string | null) => void;
  setExperienceBandFilter: (v: string | null) => void;
  setWorkplaceFilter: (v: string | null) => void;
  setDateFilter: (v: string | null) => void;
  setPlatformFilter: (v: string | null) => void;
  setSp: (params: Record<string, string>) => void;
  clearAllFilters: () => void;
  onClose: () => void;
  pillStyle: (active: boolean) => React.CSSProperties;
}

export function DashboardFilterSheet({
  roleCategoryFilter, experienceBandFilter, workplaceFilter, dateFilter, platformFilter,
  sel, activeFilterCount, visibleJobsCount, cos, roleOptions, experienceOptions,
  setRoleCategoryFilter, setExperienceBandFilter, setWorkplaceFilter, setDateFilter,
  setPlatformFilter, setSp, clearAllFilters, onClose, pillStyle,
}: DashboardFilterSheetProps) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 220, animation: 'sheetFadeIn 0.2s ease' }} />
      <div
        className="thin-scroll"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          maxHeight: '85dvh', overflowY: 'auto', overflowX: 'hidden',
          borderRadius: '24px 24px 0 0',
          border: '1.25px solid var(--border)', borderBottom: 'none',
          background: 'var(--surface-solid)',
          padding: '0 0 max(16px, env(safe-area-inset-bottom))',
          zIndex: 221,
          animation: 'sheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Handle + header */}
        <div style={{ position: 'sticky', top: 0, background: 'var(--surface-solid)', zIndex: 2, padding: '10px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '0 auto 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}>Filters</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {activeFilterCount > 0 && <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>Clear all</button>}
              <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
          </div>
        </div>

        {/* Filter sections */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Role Category */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Role</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => setRoleCategoryFilter(null)} style={pillStyle(!roleCategoryFilter)}>All</button>
              {roleOptions.filter(o => o.value).map(opt => (
                <button key={opt.label} onClick={() => setRoleCategoryFilter(roleCategoryFilter === opt.value ? null : (opt.value ?? null))} style={pillStyle(roleCategoryFilter === opt.value)}>{opt.label}</button>
              ))}
            </div>
          </div>
          {/* Experience */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Experience</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={() => setExperienceBandFilter(null)} style={pillStyle(!experienceBandFilter)}>All</button>
              {experienceOptions.filter(o => o.value).map(opt => (
                <button key={opt.label} onClick={() => setExperienceBandFilter(experienceBandFilter === opt.value ? null : (opt.value ?? null))} style={pillStyle(experienceBandFilter === opt.value)}>{opt.label}</button>
              ))}
            </div>
          </div>
          {/* Workplace */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Workplace</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[{ l: 'All', v: null }, { l: 'Remote', v: 'remote' }, { l: 'Hybrid', v: 'hybrid' }, { l: 'On-site', v: 'on-site' }].map(o => (
                <button key={o.l} onClick={() => setWorkplaceFilter(workplaceFilter === o.v ? null : o.v)} style={pillStyle(workplaceFilter === o.v)}>{o.l}</button>
              ))}
            </div>
          </div>
          {/* Date */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Posted</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[{ l: 'Any time', v: null }, { l: 'Past 24h', v: '1d' }, { l: 'Past 3 days', v: '3d' }, { l: 'Past week', v: '7d' }].map(o => (
                <button key={o.l} onClick={() => setDateFilter(dateFilter === o.v ? null : o.v)} style={pillStyle(dateFilter === o.v)}>{o.l}</button>
              ))}
            </div>
          </div>
          {/* Platform */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Job Board</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[{ l: 'All', v: null }, { l: 'Lever', v: 'lever' }, { l: 'Greenhouse', v: 'greenhouse' }, { l: 'Ashby', v: 'ashby' }, { l: 'Workable', v: 'workable' }, { l: 'Recruitee', v: 'recruitee' }, { l: 'Workday', v: 'workday' }].map(o => (
                <button key={o.l} onClick={() => setPlatformFilter(platformFilter === o.v ? null : o.v)} style={pillStyle(platformFilter === o.v)}>{o.l}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Company</p>
            <select
              value={sel}
              onChange={e => {
                const company = e.target.value;
                if (!company) {
                  setSp({});
                } else {
                  setSp({ company });
                }
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 14,
                border: '1px solid var(--border)',
                background: 'var(--surface-solid)',
                color: sel ? 'var(--ink)' : 'var(--muted-ink)',
                fontFamily: 'inherit',
                fontSize: '0.88rem',
              }}
            >
              <option value="">All companies</option>
              {cos.map(c => <option key={c.companyName} value={c.companyName}>{c.companyName}</option>)}
            </select>
          </div>
        </div>

        {/* Sticky apply button */}
        <div style={{ position: 'sticky', bottom: 0, padding: '12px 20px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', background: 'var(--surface-solid)', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12,
              background: 'var(--primary)', color: '#fff', border: 'none',
              fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'opacity 0.15s',
            }}
          >
            Show {visibleJobsCount} jobs
          </button>
        </div>
      </div>
    </>
  );
}
