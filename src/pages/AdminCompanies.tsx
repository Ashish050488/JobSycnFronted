// FILE: src/pages/AdminCompanies.tsx
// Admin-only page; preserved for compatibility. Not currently routed in App.tsx.
import { Container, PageHeader, EmptyState } from '../components/ui';
import { Building2 } from 'lucide-react';

export default function AdminCompanies() {
  return (
    <Container size="lg" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <PageHeader label="Admin" title="Manage companies" />
      <EmptyState
        icon={<Building2 size={28} />}
        title="Admin interface"
        body="This view is reserved for admin tooling. Sign in with an admin account to manage companies."
      />
    </Container>
  );
}
