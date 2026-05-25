import { Search, X } from 'lucide-react';

interface DashboardSearchBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: 'default' | 'match';
  setSortBy: (v: 'default' | 'match') => void;
  isXsSm: boolean;
  currentUser: unknown;
  userSkills: string[];
}

export function DashboardSearchBar({
  searchQuery, setSearchQuery, sortBy, setSortBy,
  isXsSm, currentUser, userSkills,
}: DashboardSearchBarProps) {
  return (
    <>
      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-ink)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, company, location, or tech stack..."
            style={{
              width: '100%', height: 48, padding: '10px 36px 10px 38px', borderRadius: 12,
              border: '1.25px solid var(--border)', background: 'var(--surface-solid)',
              color: 'var(--ink)', fontSize: isXsSm ? 16 : '0.92rem', fontFamily: 'inherit',
              outline: 'none', transition: 'border-color 0.18s',
              boxSizing: 'border-box',
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
            onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted-ink)', display: 'flex', alignItems: 'center', padding: 2,
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
      {/* Sort by skills row — only when user has skills and is logged in */}
      {currentUser && userSkills.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-ink)' }}>Sort by:</span>
          <button
            onClick={() => setSortBy(sortBy === 'match' ? 'default' : 'match')}
            style={{
              padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontFamily: 'inherit',
              border: sortBy === 'match' ? '1.5px solid var(--primary)' : '1.25px solid var(--border)',
              background: sortBy === 'match' ? 'var(--primary)' : 'transparent',
              color: sortBy === 'match' ? '#fff' : 'var(--muted-ink)',
              cursor: 'pointer', fontWeight: sortBy === 'match' ? 600 : 400, transition: 'all 0.18s',
            }}
          >
            ✶ Best match
          </button>
          {sortBy === 'match' && (
            <button
              onClick={() => setSortBy('default')}
              style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.75rem', fontFamily: 'inherit', border: '1.25px solid var(--border)', background: 'transparent', color: 'var(--muted-ink)', cursor: 'pointer', transition: 'all 0.18s' }}
            >
              Default
            </button>
          )}
        </div>
      )}
    </>
  );
}
