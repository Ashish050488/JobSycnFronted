// FILE: src/pages/employer/Jobs/ApplicantStageHistory.tsx
// Stage-history timeline (D7). Renders each stage_change newest-first as a row with
// "from → to", relative time, and an optional note. Archive rows (note starts with
// "Archived:") get a distinct danger colour so a terminal move reads at a glance.
// Empty state when the applicant has never moved.

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, Stack } from '../../../components/ui';
import type { Stage, StageChange } from '../../../types/employer-applicants';
import { formatRelativeTime } from './applicant-view-helpers';

const HISTORY_LABEL = 'Stage history';
const HISTORY_CONTENT_ID = 'applicant-stage-history';

function stageName(stages: Map<string, string>, id: string | null): string {
  if (!id) return '—';
  return stages.get(id) ?? '—';
}

function isArchiveRow(change: StageChange): boolean {
  return (change.note ?? '').startsWith('Archived:');
}

function HistoryRow({ change, stages }: { change: StageChange; stages: Map<string, string> }) {
  const archived = isArchiveRow(change);
  const from = stageName(stages, change.fromStageId);
  const to = stageName(stages, change.toStageId);
  const transition = change.fromStageId === change.toStageId ? to : `${from} → ${to}`;
  return (
    <li style={{ display: 'flex', gap: 10, listStyle: 'none' }}>
      <span aria-hidden style={{ marginTop: 6, flexShrink: 0, width: 8, height: 8, borderRadius: 999, background: archived ? 'var(--danger)' : 'var(--accent)' }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: archived ? 'var(--danger)' : 'var(--ink)' }}>
          {archived ? change.note : transition}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
          {change.movedAt ? formatRelativeTime(change.movedAt) : '—'}
        </div>
        {!archived && change.note && (
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.45 }}>{change.note}</div>
        )}
      </div>
    </li>
  );
}

export default function ApplicantStageHistory({
  stageChanges, stages,
}: {
  stageChanges: StageChange[];
  stages: Stage[];
}) {
  const stageNames = new Map(stages.map((stage) => [stage.id, stage.text]));
  const ordered = [...stageChanges].sort(
    (a, b) => new Date(b.movedAt ?? 0).getTime() - new Date(a.movedAt ?? 0).getTime(),
  );
  const entryCount = ordered.length;
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const triggerLabel = `${HISTORY_LABEL} · ${entryCount === 0 ? 'No entries yet' : entryCount}`;

  return (
    <Card padding="md">
      <Stack gap={14}>
        <button
          type="button"
          onClick={() => setIsHistoryOpen((open) => !open)}
          aria-expanded={isHistoryOpen}
          aria-controls={HISTORY_CONTENT_ID}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            width: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-muted)',
          }}
        >
          {triggerLabel}
          <ChevronDown size={16} aria-hidden style={{ transition: 'transform 180ms ease', transform: `rotate(${isHistoryOpen ? 90 : 0}deg)` }} />
        </button>
        {isHistoryOpen && (
          <div id={HISTORY_CONTENT_ID}>
            {entryCount === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: 0 }}>No stage changes yet.</p>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: 0, padding: 0 }}>
                {ordered.map((change) => <HistoryRow key={change.id} change={change} stages={stageNames} />)}
              </ul>
            )}
          </div>
        )}
      </Stack>
    </Card>
  );
}
