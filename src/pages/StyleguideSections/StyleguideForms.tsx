// FILE: src/pages/StyleguideSections/StyleguideForms.tsx
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input, Select, Textarea, Checkbox, Radio, Switch } from '../../components/ui';
import { Section, Row, Stack } from './Section';

const FRUIT = [
  { value: 'apple', label: 'Apple' },
  { value: 'mango', label: 'Mango' },
  { value: 'pear', label: 'Pear' },
];

export default function StyleguideForms() {
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState('mango');
  const [on, setOn] = useState(true);

  return (
    <Section title="Forms">
      <Stack label="Text fields">
        <Input label="Email" type="email" placeholder="you@example.com" hint="We never share it." />
        <Input label="Search" type="search" placeholder="Search…" leftIcon={<Search size={15} />} />
        <Input label="Password" type="password" placeholder="••••••" error="Too short" />
        <Input label="Disabled" placeholder="Disabled" disabled />
      </Stack>

      <Stack label="Select & textarea">
        <Select label="Fruit" options={FRUIT} placeholder="Pick one" />
        <Select label="Fruit (error)" options={FRUIT} error="Required" defaultValue="" />
        <Textarea label="Notes" placeholder="Type here…" hint="Auto-grows" autoGrow />
        <Textarea label="Disabled" placeholder="Disabled" disabled />
      </Stack>

      <Row label="Checkbox">
        <Checkbox label="Checked" checked={checked} onChange={setChecked} />
        <Checkbox label="Unchecked" checked={false} onChange={() => {}} />
        <Checkbox label="Error" checked={false} onChange={() => {}} error />
        <Checkbox label="Disabled" checked onChange={() => {}} disabled />
      </Row>

      <Row label="Radio (horizontal)">
        <Radio options={FRUIT} value={radio} onChange={setRadio} direction="horizontal" />
      </Row>
      <Stack label="Radio (vertical)">
        <Radio options={FRUIT} value={radio} onChange={setRadio} direction="vertical" />
      </Stack>

      <Row label="Switch">
        <Switch label="Notifications" checked={on} onChange={setOn} />
        <Switch label="Disabled" checked={false} onChange={() => {}} disabled />
      </Row>
    </Section>
  );
}
