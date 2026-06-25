// FILE: src/pages/StyleguideSections/StyleguideFeedback.tsx
import { useState } from 'react';
import { Inbox, HelpCircle } from 'lucide-react';
import {
  SkeletonLine, SkeletonCard, EmptyState, Alert, Tooltip, Stepper, Table, Tabs, Badge, Button,
} from '../../components/ui';
import type { Column } from '../../components/ui';
import { Section, Row, Stack } from './Section';

interface Job { role: string; company: string; status: string }
const JOBS: Job[] = [
  { role: 'Frontend Engineer', company: 'Acme', status: 'Open' },
  { role: 'Backend Engineer', company: 'Globex', status: 'Closed' },
  { role: 'Designer', company: 'Initech', status: 'Open' },
];
const COLUMNS: Column<Job>[] = [
  { key: 'role', header: 'Role', sortable: true },
  { key: 'company', header: 'Company', sortable: true },
  { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'Open' ? 'success' : 'neutral'} size="sm">{r.status}</Badge> },
];

const STEPS = [
  { id: 'a', label: 'Account' },
  { id: 'b', label: 'Profile' },
  { id: 'c', label: 'Review' },
];

export default function StyleguideFeedback() {
  const [step, setStep] = useState('b');

  return (
    <>
      <Section title="Loading">
        <Stack label="Skeleton line">
          <SkeletonLine width="60%" />
          <SkeletonLine />
        </Stack>
        <Row label="Skeleton card">
          <div style={{ width: 280 }}><SkeletonCard lines={3} /></div>
        </Row>
      </Section>

      <Section title="Alerts">
        <Stack>
          <Alert type="success">Saved successfully.</Alert>
          <Alert type="error">Something went wrong.</Alert>
          <Alert type="warning">Heads up — check this.</Alert>
          <Alert type="info">Just so you know.</Alert>
        </Stack>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={<Inbox size={28} />}
          heading="Nothing here yet"
          description="When you apply to jobs, they'll show up here."
          action={{ label: 'Browse jobs', onClick: () => {} }}
        />
      </Section>

      <Section title="Tooltip">
        <Row>
          <Tooltip content="Top tooltip"><Button variant="secondary">Top</Button></Tooltip>
          <Tooltip content="Bottom tooltip" position="bottom"><Button variant="secondary">Bottom</Button></Tooltip>
          <Tooltip content="Help text" position="right"><HelpCircle size={18} color="var(--ink-muted)" /></Tooltip>
        </Row>
      </Section>

      <Section title="Stepper">
        <Stepper steps={STEPS} currentStepId={step} />
        <Row>
          {STEPS.map((s) => <Button key={s.id} size="sm" variant="ghost" onClick={() => setStep(s.id)}>{s.label}</Button>)}
        </Row>
      </Section>

      <Section title="Tabs">
        <Tabs
          variant="underline"
          tabs={[
            { id: 'one', label: 'Overview', content: <p style={{ color: 'var(--ink-muted)' }}>Overview content.</p> },
            { id: 'two', label: 'Details', content: <p style={{ color: 'var(--ink-muted)' }}>Details content.</p> },
          ]}
        />
        <Tabs
          variant="pill"
          tabs={[
            { id: 'a', label: 'Pill A', content: <p style={{ color: 'var(--ink-muted)' }}>Pill A content.</p> },
            { id: 'b', label: 'Pill B', content: <p style={{ color: 'var(--ink-muted)' }}>Pill B content.</p> },
          ]}
        />
      </Section>

      <Section title="Table">
        <Table columns={COLUMNS} data={JOBS} onSort={() => {}} />
        <Table columns={COLUMNS} data={[]} emptyMessage="No jobs found" />
      </Section>
    </>
  );
}
