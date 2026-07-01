// FILE: src/types/seeker-profile.ts
// Parsed-resume profile types — mirror the backend 4.7A normalized shape
// (resume-parser-service.js). Seeker audience only.

export interface ProfileExperience {
  company: string | null;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  responsibilities: string[];
  technologies: string[];
}

export interface ProfileEducation {
  institution: string | null;
  degree: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  cgpa: number | null;
  percentage: number | null;
  collegeTier: 'Tier-1' | 'Tier-2' | 'Tier-3' | null;
}

export interface ProfileSkill { name: string; category: string | null; proficiency: string | null }
export interface ProfileLanguage { language: string; proficiency: string | null }
export interface ProfileCTC { amount: number | null; currency: string }

export interface ParsedProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  currentLocation: { city: string | null; state: string | null } | null;
  linkedinUrl: string | null;
  summary: string | null;
  experience: ProfileExperience[];
  education: ProfileEducation[];
  skills: ProfileSkill[];
  totalExperienceYears: number | null;
  seniorityLevel: string | null;
  domain: string | null;
  subDomain: string | null;
  currentCTC: ProfileCTC | null;
  expectedCTC: ProfileCTC | null;
  noticePeriod: string | null;
  languages: ProfileLanguage[];
  certifications: Array<{ name: string; issuer: string | null }>;
  projects: Array<{ name: string; description: string | null; technologies: string[] }>;
  parsedAt: string | null;
}

export interface ResumeUploadResult { profile: ParsedProfile; isUnchanged: boolean }
