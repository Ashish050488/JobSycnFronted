// FILE: src/pages/Dashboard/MobileSheets.tsx
// The two mobile-only modal sheets bundled together.

import type { IJob } from '../../types';
import DashboardJobSheet from '../../components/DashboardJobSheet';
import DashboardFilterSheet from '../../components/DashboardFilterSheet';
import { ROLE_OPTIONS, EXPERIENCE_OPTIONS } from './constants';

interface Props {
  // Job sheet
  job: IJob | null;
  jobSheetOpen: boolean;
  onCloseJobSheet: () => void;
  companyDomainMap: Map<string, string>;
  appliedJobIds: Set<string>;
  comeBackMap: Record<string, string>;
  onToggleApplied: (id: string) => void;
  onToggleComeBack: (id: string, note?: string) => void;
  onRemoveComeBack: (id: string) => void;
  onSelectJob: (job: IJob) => void;
  // Filter sheet
  filterSheetOpen: boolean;
  onCloseFilterSheet: () => void;
  activeFilterCount: number;
  visibleJobsCount: number;
  clearAllFilters: () => void;
  roleCategoryFilter: string;
  experienceBandFilter: string;
  workplaceFilter: string;
  dateFilter: string;
  platformFilter: string;
  setRoleCategoryFilter: (v: string) => void;
  setExperienceBandFilter: (v: string) => void;
  setWorkplaceFilter: (v: string) => void;
  setDateFilter: (v: string) => void;
  setPlatformFilter: (v: string) => void;
  setSp: (fn: (sp: URLSearchParams) => void) => void;
}

export default function MobileSheets(p: Props) {
  return (
    <>
      <DashboardJobSheet
        job={p.job}
        isOpen={p.jobSheetOpen}
        onClose={p.onCloseJobSheet}
        domain={p.job ? p.companyDomainMap.get(p.job.Company) : undefined}
        appliedJobIds={p.appliedJobIds}
        comeBackMap={p.comeBackMap}
        onToggleApplied={p.onToggleApplied}
        onToggleComeBack={p.onToggleComeBack}
        onRemoveComeBack={p.onRemoveComeBack}
        onSelectJob={p.onSelectJob}
      />
      <DashboardFilterSheet
        isOpen={p.filterSheetOpen}
        onClose={p.onCloseFilterSheet}
        activeFilterCount={p.activeFilterCount}
        visibleJobsCount={p.visibleJobsCount}
        clearAllFilters={p.clearAllFilters}
        roleCategoryFilter={p.roleCategoryFilter}
        experienceBandFilter={p.experienceBandFilter}
        workplaceFilter={p.workplaceFilter}
        dateFilter={p.dateFilter}
        platformFilter={p.platformFilter}
        roleOptions={ROLE_OPTIONS}
        experienceOptions={EXPERIENCE_OPTIONS}
        setRoleCategoryFilter={p.setRoleCategoryFilter}
        setExperienceBandFilter={p.setExperienceBandFilter}
        setWorkplaceFilter={p.setWorkplaceFilter}
        setDateFilter={p.setDateFilter}
        setPlatformFilter={p.setPlatformFilter}
        setSp={p.setSp}
      />
    </>
  );
}
