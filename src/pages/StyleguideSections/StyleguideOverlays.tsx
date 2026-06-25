// FILE: src/pages/StyleguideSections/StyleguideOverlays.tsx
import { useState } from 'react';
import { Button, Modal, Drawer, FileUpload, useToast } from '../../components/ui';
import { Section, Row } from './Section';

export default function StyleguideOverlays() {
  const [modal, setModal] = useState(false);
  const [drawerRight, setDrawerRight] = useState(false);
  const [drawerBottom, setDrawerBottom] = useState(false);
  const { showToast } = useToast();

  return (
    <>
      <Section title="Overlays">
        <Row label="Modal & drawers">
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => setDrawerRight(true)}>Open right drawer</Button>
          <Button variant="secondary" onClick={() => setDrawerBottom(true)}>Open bottom drawer</Button>
        </Row>
        <Row label="Toasts">
          <Button variant="success" onClick={() => showToast('success', 'Saved successfully')}>Success toast</Button>
          <Button variant="danger" onClick={() => showToast('error', 'Something failed')}>Error toast</Button>
          <Button variant="ghost" onClick={() => showToast('info', 'Just so you know')}>Info toast</Button>
        </Row>
      </Section>

      <Section title="File upload">
        <FileUpload accept=".pdf,.doc,.docx" maxSizeMegabytes={5} onUpload={(f) => showToast('info', `Selected ${f.name}`)} />
      </Section>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title="Example modal"
        footer={<>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={() => setModal(false)}>Confirm</Button>
        </>}
      >
        <p style={{ margin: 0 }}>This modal traps focus, closes on Escape, and on overlay click.</p>
      </Modal>

      <Drawer isOpen={drawerRight} onClose={() => setDrawerRight(false)} title="Right drawer" side="right" width="md">
        <p style={{ margin: 0 }}>Slides in from the right on desktop.</p>
      </Drawer>

      <Drawer isOpen={drawerBottom} onClose={() => setDrawerBottom(false)} title="Bottom drawer" side="bottom">
        <p style={{ margin: 0 }}>Slides up from the bottom — the mobile sheet pattern.</p>
      </Drawer>
    </>
  );
}
