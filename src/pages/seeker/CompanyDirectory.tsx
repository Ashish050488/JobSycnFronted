// FILE: src/pages/CompanyDirectory.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Building2 } from 'lucide-react';
import { useCompanies, type SortOption } from '../hooks/useCompanies';
import { Container, PageHeader, EmptyState } from '../components/ui';
import DirectoryCard from '../components/DirectoryCard';
import SkeletonCompanyCard from '../components/SkeletonCompanyCard';
import Pagination from '../components/Pagination';
import { COPY } from '../theme/brand';

const PAGE_SIZE = 24;

export default function CompanyDirectory() {
  const [sp, setSp] = useSearchParams();
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
  const search = sp.get('q') || '';
  const sort = (sp.get('sort') || 'most-hiring') as SortOption;
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => { document.title = COPY.directory.documentTitle; }, []);

  // Debounce search. Only sync when the typed value actually differs from the
  // URL's current `q` — otherwise this effect would re-run on every navigation
  // (react-router gives `setSp` a new identity on each URL change) and wipe the
  // `page` param, bouncing the user back to page 1 when paginating.
  useEffect(() => {
    if (searchInput === search) return;
    const t = setTimeout(() => {
      setSp(p => {
        const n = new URLSearchParams(p);
        if (searchInput) n.set('q', searchInput); else n.delete('q');
        n.delete('page');
        return n;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search, setSp]);

  const { companies, total, totalPages, loading, error } = useCompanies({ page, limit: PAGE_SIZE, search, sort });

  const goToPage = (p: number) => {
    setSp(prev => { const n = new URLSearchParams(prev); n.set('page', String(p)); return n; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setSort = (s: SortOption) => {
    setSp(prev => { const n = new URLSearchParams(prev); n.set('sort', s); n.delete('page'); return n; });
  };

  return (
    <Container size="xl" style={{ paddingTop: 'clamp(24px, 5vw, 40px)', paddingBottom: 60 }}>
      <PageHeader
        label={COPY.directory.pageLabel}
        title={<>{COPY.directory.pageTitle1} <span style={{ color: 'var(--accent)' }}>{COPY.directory.pageTitle2}</span></>}
        subtitle={loading ? 'Loading…' : `${total.toLocaleString()} companies actively hiring`}
      />

      {/* Search + sort */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={COPY.directory.searchPlaceholder}
            aria-label={COPY.directory.searchAriaLabel}
            style={{
              width: '100%', padding: '10px 12px 10px 34px',
              fontFamily: 'inherit', fontSize: '0.9rem',
              background: 'var(--surface)', color: 'var(--ink)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10, outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
                color: 'var(--ink-faint)',
              }}
              aria-label="Clear"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          aria-label={COPY.directory.sortAriaLabel}
          style={{
            padding: '10px 32px 10px 12px',
            fontFamily: 'inherit', fontSize: '0.85rem',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10, cursor: 'pointer', outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236F6E69' stroke-width='2'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
          }}
        >
          <option value="most-hiring">{COPY.directory.sortMostHiring}</option>
          <option value="a-z">{COPY.directory.sortAZ}</option>
          <option value="z-a">{COPY.directory.sortZA}</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="companies-grid">
          {Array(8).fill(0).map((_, i) => <SkeletonCompanyCard key={i} />)}
        </div>
      ) : error ? (
        <EmptyState icon={<Building2 size={28} />} title="Couldn't load companies" body={error} />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title={COPY.directory.noCompaniesTitle}
          body={COPY.directory.noCompaniesBody}
        />
      ) : (
        <>
          <div className="companies-grid stagger">
            {companies.map(c => (
              <DirectoryCard key={c._id || c.companyName} company={c} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ marginTop: 32 }}>
              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
            </div>
          )}
        </>
      )}
    </Container>
  );
}
