import { Mail } from 'lucide-react';
import { Container, PageHeader, Divider, Card } from '../components/ui';

const SECTIONS = [
  { title: '1. Project Purpose', body: 'This website is a personal, non-commercial project created to aggregate and share tech job opportunities in India. The purpose is to make it easier for professionals to discover roles at top Indian tech companies. All information is for informational and educational purposes only. This site does not provide recruitment, hiring, legal, immigration, or career advisory services.' },
  { title: '2. No Recruitment or Hiring Service', body: 'This website is not a recruitment agency, does not represent employers, and does not guarantee interviews, responses, or job offers. All job listings link to external company career pages. Any hiring decisions, requirements, or communications are handled entirely by the respective employers.' },
  { title: '3. Accuracy & Filtering Disclaimer', body: 'Job listings are aggregated using automated scraping systems. However: job details may change or become outdated; requirements may change over time; employers may assess candidates differently during interviews. Users are responsible for verifying all job details directly with the employer.' },
  { title: '4. Use of the Website', body: 'You may use this website for personal, non-commercial purposes only. You agree not to scrape, copy, or redistribute job listings in bulk; republish or commercialize site content; or use the site for misleading, unlawful, or harmful purposes. All job descriptions, trademarks, company names, and related content remain the property of their respective owners.' },
  { title: '5. Third-Party Links', body: 'This website contains links to third-party websites (employer career pages). We do not control, endorse, or take responsibility for the content, accuracy, availability, or policies of external sites.' },
  { title: '6. Privacy & Data', body: 'When you submit your email address, it is stored for the purpose of sending job-related email notifications. We do not sell or share your email with third parties. You may request deletion of your data at any time by contacting us via the legal page.' },
];

export default function Legal() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      <div style={{ background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)', padding: '48px 0' }}>
        <Container size="md">
          <PageHeader label="Legal" title="Legal Information" subtitle="Last updated: 28 January 2026" />
        </Container>
      </div>
      <Container size="md" style={{ padding: '40px 24px' }}>
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {SECTIONS.map((s, i) => (
              <div key={i}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>{s.title}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted-ink)', lineHeight: 1.8 }}>{s.body}</p>
                {i < SECTIONS.length - 1 && <Divider style={{ marginTop: 28 }} />}
              </div>
            ))}
            <Divider />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px', background: 'var(--paper2)', border: '1.25px solid var(--border)', borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, background: 'var(--primary-soft)', border: '1.25px solid var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}><Mail size={16} /></div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: 4 }}>Contact</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-ink)', lineHeight: 1.6 }}>For questions, data deletion requests, or legal enquiries, please use the contact details available on the legal page or reach out via the footer links.</p>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
