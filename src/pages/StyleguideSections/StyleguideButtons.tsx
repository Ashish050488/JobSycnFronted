// FILE: src/pages/StyleguideSections/StyleguideButtons.tsx
import { ArrowRight, Plus } from 'lucide-react';
import { Button, Badge, Avatar, Card } from '../../components/ui';
import { Section, Row } from './Section';

export default function StyleguideButtons() {
  return (
    <>
      <Section title="Buttons">
        <Row label="Variants">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
        </Row>
        <Row label="Sizes">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row label="Icons, loading, disabled">
          <Button iconLeft={<Plus size={15} />}>Add</Button>
          <Button iconRight={<ArrowRight size={15} />}>Next</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </Row>
        <Row label="Full width">
          <div style={{ width: '100%' }}><Button fullWidth>Full width</Button></div>
        </Row>
      </Section>

      <Section title="Badges">
        <Row label="Variants">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
        </Row>
        <Row label="Sizes">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
        </Row>
      </Section>

      <Section title="Avatar">
        <Row label="Sizes + fallback">
          <Avatar name="Ada Lovelace" size="sm" />
          <Avatar name="Ada Lovelace" size="md" />
          <Avatar name="Grace Hopper" size="lg" />
          <Avatar name="Linus" src="https://invalid.example/none.png" size="md" />
        </Row>
      </Section>

      <Section title="Cards">
        <Row>
          <Card variant="flat" padding="md" style={{ width: 200 }}>Flat card</Card>
          <Card variant="raised" padding="md" style={{ width: 200 }}>Raised card</Card>
        </Row>
      </Section>
    </>
  );
}
