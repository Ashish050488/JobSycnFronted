// FILE: src/pages/seeker/ResumeUpload.tsx
// Resume upload page (/resume). ConsentGate (4.5B) collects resume_parsing
// consent before the upload zone is revealed (C9). On completion it routes to the
// profile page; an unchanged resume just toasts rather than re-parsing.

import { useNavigate } from 'react-router-dom';
import { Container, PageHeader, useToast } from '../../components/ui';
import ConsentGate from '../../components/shared/ConsentGate';
import ResumeUploadZone from '../../components/seeker/ResumeUploadZone';

const DATA_ITEMS = [
  'resume text',
  'parsed profile (name, skills, experience, education, contact)',
];

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleComplete = (_profile: unknown, isUnchanged: boolean) => {
    if (isUnchanged) showToast('info', 'Resume unchanged — profile already up to date.');
    navigate('/profile', { replace: true });
  };

  return (
    <Container size="md" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <PageHeader label="SEEKER" title="Upload your resume" />
      <ConsentGate
        purpose="resume_parsing"
        dataItems={DATA_ITEMS}
        crossBorderTransfer
        title="Resume parsing consent"
        description="We'll extract structured data from your resume using AI to match you with relevant jobs. Your PDF is deleted after parsing — only the structured profile is kept."
      >
        <ResumeUploadZone onUploadComplete={handleComplete} />
      </ConsentGate>
    </Container>
  );
}
