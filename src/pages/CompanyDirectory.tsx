import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useCompanies } from '../hooks/useCompanies';
import type { SortOption } from '../hooks/useCompanies';
import CompanyCard from '../components/DirectoryCard';
import SkeletonCompanyCard from '../components/SkeletonCompanyCard';
import Pagination from '../components/Pagination';
import { Container, PageHeader, Badge, EmptyState } from '../components/ui';
import { COPY } from '../theme/brand';

const ITEMS_PER_PAGE = 24;

export default function CompanyDirectory() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven state
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const qParam = searchParams.get('q') || '';
  const sortParam = (searchParams.get('sort') || 'a-z') as SortOption;

  const [searchInput, setSearchInput] = useState(qParam);
  const [sort, setSort] = useState<SortOption>(sortParam);
  const [page, setPage] = useState(pageParam);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState(qParam);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1); // Reset to page 1 on search change
    }, 300);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const { companies, total, totalPages, loading } = useCompanies({
    page,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch,
    sort,
  });

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 1) params.page = String(page);
    if (debouncedSearch) params.q = debouncedSearch;
    if (sort !== 'a-z') params.sort = sort;
    setSearchParams(params, { replace: true });
  }, [page, debouncedSearch, sort, setSearchParams]);

  useEffect(() => {
    document.title = COPY.directory.documentTitle;
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  };

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '14px 0 10px' }}>
        <Container size="md" style={{ textAlign: 'center' }}>
          <PageHeader label={COPY.directory.pageLabel} title={<>{COPY.directory.pageTitle1}<br /><span style={{ color: 'var(--primary)' }}>{COPY.directory.pageTitle2}</span></>} subtitle={COPY.directory.subtitle} />
        </Container>
      </div>

      {/* ── Content ────────────────────────────────────── */}
      <Container style={{ padding: '32px 24px 48px' }}>
        {/* Sticky filter bar */}
        <div className="sticky-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, maxWidth: 360, minWidth: 180 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--subtle-ink)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder={COPY.directory.searchPlaceholder}
                aria-label={COPY.directory.searchAriaLabel}
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 38px', fontFamily: 'inherit', fontSize: '0.875rem',
                  background: 'var(--paper2)', color: 'var(--ink)', border: '1.25px solid var(--border)',
                  borderRadius: 10, outline: 'none',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <Badge variant="neutral">{total} compan{total === 1 ? 'y' : 'ies'}</Badge>
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpDown size={14} style={{ color: 'var(--subtle-ink)' }} />
            <select
              value={sort}
              onChange={e => handleSortChange(e.target.value as SortOption)}
              aria-label={COPY.directory.sortAriaLabel}
              style={{
                padding: '8px 32px 8px 10px', fontFamily: 'inherit', fontSize: '0.85rem',
                background: 'var(--paper2)', color: 'var(--ink)', border: '1.25px solid var(--border)',
                borderRadius: 10, outline: 'none', cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236F6F6F' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
              }}
            >
              <option value="a-z">{COPY.directory.sortAZ}</option>
              <option value="z-a">{COPY.directory.sortZA}</option>
              <option value="most-hiring">{COPY.directory.sortMostHiring}</option>
            </select>
          </div>
        </div>

        {/* ── Grid ──────────────────────────────────── */}
        {loading ? (
          <div className="companies-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCompanyCard key={i} />)}
          </div>
        ) : companies.length === 0 ? (
          <EmptyState title={COPY.directory.noCompaniesTitle} body={COPY.directory.noCompaniesBody} />
        ) : (
          <>
            <div className="companies-grid stagger">
              {companies.map(c => <CompanyCard key={c.companyName} company={c} />)}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </Container>
    </div>
  );
}
