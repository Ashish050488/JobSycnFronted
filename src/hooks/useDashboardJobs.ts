// FILE: src/hooks/useDashboardJobs.ts
import { useState, useCallback, useEffect } from 'react';
import type { IJob } from '../types';

const PAGE_SIZE = 30;

export interface ServerFilters {
  company: string;
  roleCategory: string | null;
  experienceBand: string | null;
  entryLevel: boolean;
  remote: boolean;
  platform: string | null;
}

export interface UseDashboardJobsReturn {
  jobs: IJob[];
  loading: boolean;
  isLoadingMore: boolean;
  totalJobs: number;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  fetchJobs: (pageNum: number, append: boolean) => Promise<void>;
  handleLoadMore: () => void;
}

export function useDashboardJobs(filters: ServerFilters): UseDashboardJobsReturn {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchJobs = useCallback(async (pageNum: number, append: boolean) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentPage(1);
      setJobs([]);
    }

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
      });
      if (filters.company) params.set('company', filters.company);
      if (filters.roleCategory) params.set('roleCategory', filters.roleCategory);
      if (filters.experienceBand) params.set('experienceBand', filters.experienceBand);
      if (filters.entryLevel) params.set('entryLevel', 'true');
      if (filters.remote) params.set('remote', 'true');
      if (filters.platform) params.set('platform', filters.platform);

      const jr = await fetch(`/api/jobs?${params}`);
      const jd = await jr.json() as {
        jobs?: IJob[];
        totalJobs?: number;
        totalPages?: number;
        currentPage?: number;
      };

      const newJobs = jd.jobs ?? [];
      setTotalJobs(jd.totalJobs ?? 0);
      setTotalPages(jd.totalPages ?? 1);
      setCurrentPage(jd.currentPage ?? pageNum);
      setJobs(prev => append ? [...prev, ...newJobs] : newJobs);
    } catch (e) {
      console.error(e);
    } finally {
      if (append) setIsLoadingMore(false);
      else setLoading(false);
    }
  }, [
    filters.company,
    filters.roleCategory,
    filters.experienceBand,
    filters.entryLevel,
    filters.remote,
    filters.platform,
  ]);

  // Re-fetch from page 1 whenever server-side filters change
  useEffect(() => {
    fetchJobs(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.company,
    filters.roleCategory,
    filters.experienceBand,
    filters.entryLevel,
    filters.remote,
    filters.platform,
  ]);

  const handleLoadMore = useCallback(() => {
    const nextPage = currentPage + 1;
    fetchJobs(nextPage, true);
  }, [currentPage, fetchJobs]);

  const hasMore = currentPage < totalPages;

  return {
    jobs,
    loading,
    isLoadingMore,
    totalJobs,
    currentPage,
    totalPages,
    hasMore,
    fetchJobs,
    handleLoadMore,
  };
}
