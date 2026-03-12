// FILE: src/types/index.ts
export interface IJobAutoTags {
  techStack: string[];
  roleCategory: string | null;
  experienceBand: string | null;
  isEntryLevel: boolean | null;
  domain: string[];
  urgency: string | null;
  education: string | null;
}

export interface IJob {
  _id: string;
  JobID: string;
  JobTitle: string;
  Company: string;
  Location: string;
  ApplicationURL: string;
  PostedDate: string | null;
  Description: string;
  Department?: string;
  ContractType?: string;
  sourceSite?: string;
  Status?: string;
  scrapedAt?: string;

  // --- ATS source data ---
  DirectApplyURL?: string | null;
  Team?: string | null;
  AllLocations?: string[];
  Tags?: string[];
  WorkplaceType?: string | null;
  IsRemote?: boolean | null;

  // --- Description variants ---
  DescriptionPlain?: string | null;
  DescriptionLists?: Array<{ text: string; content: string }>;
  DescriptionCleaned?: string | null;
  AdditionalInfo?: string | null;

  // --- Salary ---
  SalaryMin?: number | null;
  SalaryMax?: number | null;
  SalaryCurrency?: string | null;
  SalaryInterval?: string | null;
  SalaryInfo?: string | null;

  // --- Office/Location detail ---
  Office?: string | null;

  // --- ATS platform ---
  ATSPlatform?: string | null;

  // --- Entry-level tagging ---
  isEntryLevel?: boolean | null;
  autoTags?: IJobAutoTags | null;
}

export interface AppliedJobEntry {
  jobId: string;
  appliedAt: string;
}

export interface AppliedJobDetail extends AppliedJobEntry {
  jobTitle: string;
  company: string;
  applicationURL: string | null;
}

export interface ICompany {
  _id?: string;
  companyName: string;
  openRoles: number;
  cities: string[];
  domain: string;
  source: 'scraped' | 'manual';
  logo?: string;
  industry?: string;
}