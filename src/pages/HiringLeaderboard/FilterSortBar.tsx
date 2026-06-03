// FILE: src/pages/HiringLeaderboard/FilterSortBar.tsx
import { FILTER_OPTIONS, SORT_OPTIONS } from './constants';

interface Props {
  filterSignal: string;
  sortKey: string;
  setSp: (fn: (p: URLSearchParams) => URLSearchParams) => void;
}

export default function FilterSortBar({ filterSignal, sortKey, setSp }: Props) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {FILTER_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => setSp(p => { const n = new URLSearchParams(p); n.set('filter', o.value); return n; })}
            style={{
              padding: '6px 12px', borderRadius: 999,
              fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 500,
              background: filterSignal === o.value ? 'var(--ink)' : 'transparent',
              color: filterSignal === o.value ? 'var(--paper)' : 'var(--ink-muted)',
              border: '1px solid',
              borderColor: filterSignal === o.value ? 'var(--ink)' : 'var(--border-strong)',
              cursor: 'pointer',
            }}
          >{o.label}</button>
        ))}
      </div>
      <span style={{ flex: 1 }} />
      <select
        value={sortKey}
        onChange={e => setSp(p => { const n = new URLSearchParams(p); n.set('sort', e.target.value); return n; })}
        style={{
          padding: '7px 30px 7px 12px',
          fontFamily: 'inherit', fontSize: '0.82rem',
          background: 'var(--surface)', color: 'var(--ink)',
          border: '1px solid var(--border-strong)',
          borderRadius: 9, cursor: 'pointer', outline: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236F6E69' stroke-width='2'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
        }}
      >
        {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  );
}
