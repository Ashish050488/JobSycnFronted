// FILE: src/types/index.ts
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