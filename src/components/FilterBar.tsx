import { Select, Badge } from './ui';
import { COPY } from '../theme/brand';

interface Props { companies: string[]; selectedCompany: string; onSelectCompany: (c: string) => void; totalJobs: number; }
export default function FilterBar({ companies, selectedCompany, onSelectCompany, totalJobs }: Props) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24, padding: '14px 18px', background: 'var(--surface-solid)', border: '1.25px solid var(--border)', borderRadius: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>{COPY.jobs.feedTitle}</h2>
        <Badge variant="neutral">{totalJobs} {COPY.jobs.rolesLabel}</Badge>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span className="font-sketch" style={{ fontSize: '1rem', color: 'var(--primary)', whiteSpace: 'nowrap' }}>{COPY.jobs.filterLabel}</span>
        <Select value={selectedCompany} onChange={e => onSelectCompany(e.target.value)} style={{ minWidth: 180, padding: '8px 36px 8px 12px', fontSize: '0.875rem' }}>
          <option value="">{COPY.jobs.allCompanies}</option>
          {companies.map((c, i) => <option key={i} value={c}>{c}</option>)}
        </Select>
      </div>
    </div>
  );
}
