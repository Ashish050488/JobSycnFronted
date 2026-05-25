import { ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from './ui';
import { COPY } from '../theme/brand';
import JobDetailPanel from './JobDetailPanel';
import type { AppUser } from '../context/UserContext';
import type { IJob } from '../types';

interface SheetActionsProps {
  job: IJob;
  isXsSm: boolean;
  appliedJobIds: Set<string>;
  currentUser: AppUser | null;
  onToggleApplied: (jobId: string) => Promise<void>;
}

function SheetActions({ job, isXsSm, appliedJobIds, currentUser, onToggleApplied }: SheetActionsProps) {
  const applied = appliedJobIds.has(job._id);
  return (
    <div className="mobile-sticky-actions" style={{
      display: 'flex',
      flexDirection: isXsSm ? 'column' : 'row',
      gap: 10,
    }}>
      <a href={job.DirectApplyURL || job.ApplicationURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flex: 1 }}>
        <Button size="lg" style={{ width: '100%', minHeight: 44 }}>{COPY.jobs.applyNow} <ExternalLink size={14} /></Button>
      </a>
      {currentUser && (
        <button
          onClick={() => onToggleApplied(job._id)}
          style={{
            minHeight: 44,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 10, cursor: 'pointer',
            fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit',
            transition: 'all 0.18s', flexShrink: 0,
            background: applied ? 'var(--primary)' : 'transparent',
            color: applied ? '#fff' : 'var(--primary)',
            border: '1.5px solid var(--primary)',
            width: isXsSm ? '100%' : 'auto',
            justifyContent: 'center',
          }}
        >
          <CheckCircle2 size={15} />
          {applied ? 'Applied' : 'Mark Applied'}
        </button>
      )}
    </div>
  );
}

interface DashboardJobSheetProps {
  selectedJob: IJob;
  isXsSm: boolean;
  isShortLandscape: boolean;
  is3xl: boolean;
  appliedJobIds: Set<string>;
  comeBackMap: Map<string, { note: string; addedAt: string }>;
  currentUser: AppUser | null;
  onClose: () => void;
  onToggleApplied: (jobId: string) => Promise<void>;
  onToggleComeBack: (jobId: string, note: string) => void;
  onRemoveComeBack: (jobId: string) => void;
  onSelectJob: (id: string) => void;
}

export function DashboardJobSheet({
  selectedJob, isXsSm, isShortLandscape, is3xl,
  appliedJobIds, comeBackMap, currentUser,
  onClose, onToggleApplied, onToggleComeBack, onRemoveComeBack, onSelectJob,
}: DashboardJobSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)',
          animation: 'sheetFadeIn 0.2s ease',
        }}
      />
      {/* Sheet */}
      <div
        onTouchStart={e => {
          const touch = e.touches[0];
          (e.currentTarget as HTMLDivElement).dataset.touchStartY = String(touch.clientY);
        }}
        onTouchEnd={e => {
          const startY = Number((e.currentTarget as HTMLDivElement).dataset.touchStartY || '0');
          const endY = e.changedTouches[0]?.clientY ?? startY;
          if (endY - startY > 50) onClose();
        }}
        style={{
          position: 'fixed',
          left: 0, right: 0, bottom: 0,
          height: isShortLandscape ? '100dvh' : (isXsSm ? '92dvh' : '84dvh'),
          maxHeight: '100dvh',
          zIndex: 201,
          background: 'var(--surface-solid)',
          borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          animation: 'sheetSlideUp 0.28s ease',
        }}
      >
        {/* Sticky header */}
        <div style={{
          padding: '18px 16px 10px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          {/* Drag handle (decorative) */}
          <div style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'var(--border-strong)',
            position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 8,
          }} />
          <div style={{ width: 60 }} />{/* spacer for centering */}
        </div>
        {/* Scrollable content */}
        <div className="thin-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isXsSm ? '16px 14px 8px' : '20px 18px 16px', WebkitOverflowScrolling: 'touch' }}>
          <JobDetailPanel
            job={selectedJob}
            mobileMode
            is3xl={is3xl}
            appliedJobIds={appliedJobIds}
            comeBackMap={comeBackMap}
            onToggleApplied={onToggleApplied}
            onToggleComeBack={onToggleComeBack}
            onRemoveComeBack={onRemoveComeBack}
            onSelectJob={onSelectJob}
          />
        </div>
        <SheetActions
          job={selectedJob}
          isXsSm={isXsSm}
          appliedJobIds={appliedJobIds}
          currentUser={currentUser}
          onToggleApplied={onToggleApplied}
        />
      </div>
    </>
  );
}
