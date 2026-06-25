// FILE: src/pages/Styleguide.tsx
// Dev-only design-system gallery. Mounted at /styleguide behind import.meta.env.DEV.
import { Container, PageHeader } from '../components/ui';
import StyleguideButtons from './StyleguideSections/StyleguideButtons';
import StyleguideForms from './StyleguideSections/StyleguideForms';
import StyleguideFeedback from './StyleguideSections/StyleguideFeedback';
import StyleguideOverlays from './StyleguideSections/StyleguideOverlays';

export default function Styleguide() {
  return (
    <Container size="lg" style={{ paddingTop: 24, paddingBottom: 96 }}>
      <PageHeader
        label="Design system"
        title="Styleguide"
        subtitle="Every primitive, every variant. Dev-only — not shipped in production."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <StyleguideButtons />
        <StyleguideForms />
        <StyleguideFeedback />
        <StyleguideOverlays />
      </div>
    </Container>
  );
}
