// FILE: src/pages/Dashboard/useDashboardFilters.ts
// Owns all filter state. Syncs writes to the URL via setSp.

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useDashboardFilters() {
  const [sp, setSpRaw] = useSearchParams();

  const setSp = (fn: (sp: URLSearchParams) => void) => {
    setSpRaw(prev => { const next = new URLSearchParams(prev); fn(next); return next; }, { replace: true });
  };

  const sel = sp.get('company') || '';
  const selectedJobParam = sp.get('selectedJob') || '';
  const [roleCategoryFilter, setRoleCategoryFilter] = useState(sp.get('role') || 'all');
  const [experienceBandFilter, setExperienceBandFilter] = useState(sp.get('exp') || 'all');
  const [workplaceFilter, setWorkplaceFilter] = useState(sp.get('wp') || 'all');
  const [dateFilter, setDateFilter] = useState(sp.get('date') || 'all');
  const [entryLevelFilter, setEntryLevelFilter] = useState(sp.get('entry') === '1');
  const [hideApplied, setHideApplied] = useState(sp.get('hideApplied') === '1');
  const [showNewOnly, setShowNewOnly] = useState(sp.get('newOnly') === '1');
  const [searchInput, setSearchInput] = useState(sp.get('q') || '');
  const [sortByMatch, setSortByMatch] = useState(sp.get('sort') === 'match');

  const activeFilters = [
    sel ? { label: sel, clear: () => setSp(p => { p.delete('company'); }) } : null,
    roleCategoryFilter !== 'all' ? { label: roleCategoryFilter, clear: () => { setRoleCategoryFilter('all'); setSp(p => { p.delete('role'); }); } } : null,
    experienceBandFilter !== 'all' ? { label: experienceBandFilter, clear: () => { setExperienceBandFilter('all'); setSp(p => { p.delete('exp'); }); } } : null,
    workplaceFilter !== 'all' ? { label: workplaceFilter, clear: () => { setWorkplaceFilter('all'); setSp(p => { p.delete('wp'); }); } } : null,
    dateFilter !== 'all' ? { label: dateFilter, clear: () => { setDateFilter('all'); setSp(p => { p.delete('date'); }); } } : null,
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => {
    setRoleCategoryFilter('all');
    setExperienceBandFilter('all');
    setWorkplaceFilter('all');
    setDateFilter('all');
    setEntryLevelFilter(false);
    setHideApplied(false);
    setShowNewOnly(false);
    setSearchInput('');
    setSpRaw({}, { replace: true });
  };

  return {
    sp, setSp,
    sel, selectedJobParam,
    roleCategoryFilter, setRoleCategoryFilter,
    experienceBandFilter, setExperienceBandFilter,
    workplaceFilter, setWorkplaceFilter,
    dateFilter, setDateFilter,
    entryLevelFilter, setEntryLevelFilter,
    hideApplied, setHideApplied,
    showNewOnly, setShowNewOnly,
    searchInput, setSearchInput,
    sortByMatch, setSortByMatch,
    activeFilters, clearAll,
  };
}
