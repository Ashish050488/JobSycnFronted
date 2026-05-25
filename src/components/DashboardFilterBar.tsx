import type { ICompany } from '../types';

interface FilterOption {
  label: string;
  value: string | null;
}

interface DashboardFilterBarProps {
  roleCategoryFilter: string | null;
  experienceBandFilter: string | null;
  workplaceFilter: string | null;
  dateFilter: string | null;
  platformFilter: string | null;
  sel: string;
  cos: ICompany[];
  roleOptions: readonly FilterOption[];
  experienceOptions: readonly FilterOption[];
  desktopSelectStyle: (active: boolean) => React.CSSProperties;
  setRoleCategoryFilter: (v: string | null) => void;
  setExperienceBandFilter: (v: string | null) => void;
  setWorkplaceFilter: (v: string | null) => void;
  setDateFilter: (v: string | null) => void;
  setPlatformFilter: (v: string | null) => void;
  setSp: (params: Record<string, string>) => void;
}

export function DashboardFilterBar({
  roleCategoryFilter, experienceBandFilter, workplaceFilter, dateFilter, platformFilter,
  sel, cos, roleOptions, experienceOptions, desktopSelectStyle,
  setRoleCategoryFilter, setExperienceBandFilter, setWorkplaceFilter, setDateFilter,
  setPlatformFilter, setSp,
}: DashboardFilterBarProps) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '12px 0 14px', marginBottom: 12, borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
      <select value={roleCategoryFilter ?? ''} onChange={e => setRoleCategoryFilter(e.target.value || null)} style={desktopSelectStyle(!!roleCategoryFilter)}><option value="">Role: All</option>{roleOptions.filter(o => o.value).map(opt => <option key={opt.label} value={opt.value!}>{opt.label}</option>)}</select>
      <select value={experienceBandFilter ?? ''} onChange={e => setExperienceBandFilter(e.target.value || null)} style={desktopSelectStyle(!!experienceBandFilter)}><option value="">Exp: All</option>{experienceOptions.filter(o => o.value).map(opt => <option key={opt.label} value={opt.value!}>{opt.label}</option>)}</select>
      <select value={workplaceFilter ?? ''} onChange={e => setWorkplaceFilter(e.target.value || null)} style={desktopSelectStyle(!!workplaceFilter)}><option value="">Workplace: All</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="on-site">On-site</option></select>
      <select value={dateFilter ?? ''} onChange={e => setDateFilter(e.target.value || null)} style={desktopSelectStyle(!!dateFilter)}><option value="">Date: All</option><option value="1d">Past 24h</option><option value="3d">Past 3d</option><option value="7d">Past 7d</option></select>
      <select value={platformFilter ?? ''} onChange={e => setPlatformFilter(e.target.value || null)} style={desktopSelectStyle(!!platformFilter)}><option value="">Board: All</option><option value="lever">Lever</option><option value="greenhouse">Greenhouse</option><option value="ashby">Ashby</option><option value="workable">Workable</option><option value="recruitee">Recruitee</option><option value="workday">Workday</option></select>
      <select value={sel} onChange={e => { const company = e.target.value; if (!company) { setSp({}); } else { setSp({ company }); } }} style={desktopSelectStyle(!!sel)}><option value="">Companies: All</option>{cos.map(c => <option key={c.companyName} value={c.companyName}>{c.companyName}</option>)}</select>
    </div>
  );
}
