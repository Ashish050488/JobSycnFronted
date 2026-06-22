// FILE: src/pages/Trends/types.ts
// Shapes returned by GET /api/jobs/trends.

export interface TrendsSummary {
  totalActiveRoles: number;
  newThisWeek: number;
  newLastWeek: number;
  wowDelta: number;
  wowPercent: number;
  categoriesTracked: number;
  companiesTracked: number;
}

export interface DailyPoint {
  date: string;   // YYYY-MM-DD
  count: number;
}

export type TrendDir = 'up' | 'down' | 'stable';

export interface CategoryTrend {
  category: string;
  totalRoles: number;
  share: number;        // 0–100
  newThisWeek: number;
  trendPercent: number; // -200–200
  trend: TrendDir;
}

export interface Mover {
  company: string;
  delta: number;
  newThisWeek: number;
  totalRoles: number;
}

export interface TrendsData {
  summary: TrendsSummary;
  daily: DailyPoint[];
  categories: CategoryTrend[];
  experience: { band: string; count: number }[];
  workplace: { type: string; count: number }[];
  movers: { gaining: Mover[]; cooling: Mover[] };
  updatedAt: string;
}

// Palette for the categorical charts (donuts / bars). Uses theme tokens where
// possible, with a few fixed hues to keep slices distinguishable.
export const SERIES_COLORS = [
  'var(--accent)',
  '#5AA8FF',
  '#37D49A',
  '#F5A623',
  '#B57BFF',
  '#FF6B8A',
  '#34C7C7',
  '#9097A8',
];
