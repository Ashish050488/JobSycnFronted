// FILE: src/theme/brand.ts
// ─── Brand Constants ─────────────────────────────────────────────────────────
// Change these to rebrand the entire app instantly

const BRAND = {
  appName: 'TechJobs',
  tagline: 'Tech Jobs in India — No Fluff',
  fullName: 'Tech Jobs in India',
  description: 'Fresh tech jobs scraped daily from top Indian companies. Direct apply links, no middlemen.',
  twitter: '',
  contact: '/legal',
} as const;

// Sketch-accent font for tiny labels & badges
const SKETCH_FONT = "'Caveat', 'Patrick Hand', 'Comic Neue', ui-sans-serif";

// Semantic colour roles — used only for inline JS references,
// all runtime styling goes through CSS variables set by ThemeProvider.
const PALETTE = {
  primary: '#2D6A4F',
  primarySoft: 'rgba(45,106,79,0.12)',
  success: '#40916C',
  danger: '#DC2626',
  warning: '#D97706',
  info: '#1F6FEB',
} as const;

// ─── Centralised UI copy ────────────────────────────────────────────────────
// Every piece of visible text lives here so a single edit updates the whole app.

const COPY = {
  nav: {
    companies: 'Companies',
    browseJobs: 'Browse Jobs',
    myProgress: 'My Progress',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
  },
  home: {
    heroLabel: 'Tech Jobs in India \u2014 No Fluff',
    heroTitle1: 'Find Your Next',
    heroTitle2: 'Tech Role in India',
    heroSubtitle: 'We scrape top Indian tech companies daily \u2014 fresh roles, direct apply links.',
    heroCTA: 'Browse Jobs',
    heroSecondaryCTA: 'View Companies',
    stat1Value: '50+',
    stat1Label: 'Companies',
    stat2Value: 'Daily',
    stat2Label: 'Fresh scrapes',
    companiesSectionLabel: 'Hiring now',
    companiesSectionTitle1: 'Top companies in',
    companiesSectionTitle2: 'India',
    scrollLeft: 'Scroll left',
    scrollRight: 'Scroll right',
    fullDirectory: 'Full directory',
    jobsSectionLabel: 'Fresh picks',
    jobsSectionTitle: 'Latest opportunities',
    viewAll: 'View all',
    loadMore: 'Load more',
  },
  jobs: {
    pageLabel: 'Opportunities',
    pageTitle: 'All Tech Jobs',
    rolesAvailable: 'roles available',
    noJobsTitle: 'No jobs found',
    noJobsBody: 'Try a different company or view all roles.',
    noEntryJobsBody: 'No entry level roles found. Try turning off the fresher filter.',
    clearFilters: 'Clear filters',
    allJobs: 'All Jobs',
    allCompanies: 'All Companies',
    experienceLabel: 'Experience',
    companiesLabel: 'Companies',
    entryLevel: '\uD83C\uDF93 Entry Level / Fresher',
    allLevels: 'All Experience Levels',
    applyNow: 'Apply Now',
    readMore: 'Read more',
    showLess: 'Show less',
    postedPrefix: 'Posted:',
    postedNA: 'Posted: N/A',
    feedTitle: 'Job Feed',
    rolesLabel: 'roles',
    filterLabel: 'Filter',
  },
  progress: {
    pageLabel: 'Tracking',
    pageTitle: 'My Progress',
    backToJobs: 'Back to jobs',
    todayLabel: "Today's Snapshot",
    noStreak: 'No streak yet',
    historyLabel: 'Recent Applications',
    historySubtitle: 'Your latest applied jobs, useful for follow-ups and interview prep.',
    emptyTitle: 'No applications tracked yet',
    emptyBody: 'Start applying from the jobs feed and your recent history will appear here.',
  },
  directory: {
    pageLabel: 'Company directory',
    pageTitle1: 'Tech Companies',
    pageTitle2: 'Hiring in India',
    subtitle: 'Companies actively hiring across India \u2014 verified by our scraper daily.',
    searchPlaceholder: 'Search companies\u2026',
    searchAriaLabel: 'Search companies',
    sortAriaLabel: 'Sort companies',
    noCompaniesTitle: 'No companies found',
    noCompaniesBody: 'Try a different search term or clear your filters.',
    sortAZ: 'A \u2192 Z',
    sortZA: 'Z \u2192 A',
    sortMostHiring: 'Most Hiring',
    documentTitle: 'Tech Companies Hiring in India | Company Directory',
  },
  footer: {
    navigateTitle: 'Navigate',
    jobFeedLink: 'Job Feed',
    companiesLink: 'Companies',
    legalTitle: 'Legal',
    legalInfoLink: 'Legal Info',
    privacyLink: 'Privacy',
    contactLink: 'Contact',
    disclaimer: 'Disclaimer: This is a non-commercial aggregator. Job details are scraped automatically \u2014 verify directly with employers.',
  },
  legal: {
    pageLabel: 'Legal',
    pageTitle: 'Legal Information',
    lastUpdated: 'Last updated: 28 January 2026',
    contactTitle: 'Contact',
    contactBody: 'For questions, data deletion requests, or legal enquiries, please use the contact details available on the legal page or reach out via the footer links.',
    sections: [
      { title: '1. Project Purpose', body: 'This website is a personal, non-commercial project created to aggregate and share tech job opportunities in India. The purpose is to make it easier for professionals to discover roles at top Indian tech companies. All information is for informational and educational purposes only. This site does not provide recruitment, hiring, legal, immigration, or career advisory services.' },
      { title: '2. No Recruitment or Hiring Service', body: 'This website is not a recruitment agency, does not represent employers, and does not guarantee interviews, responses, or job offers. All job listings link to external company career pages. Any hiring decisions, requirements, or communications are handled entirely by the respective employers.' },
      { title: '3. Accuracy & Filtering Disclaimer', body: 'Job listings are aggregated using automated scraping systems. However: job details may change or become outdated; requirements may change over time; employers may assess candidates differently during interviews. Users are responsible for verifying all job details directly with the employer.' },
      { title: '4. Use of the Website', body: 'You may use this website for personal, non-commercial purposes only. You agree not to scrape, copy, or redistribute job listings in bulk; republish or commercialize site content; or use the site for misleading, unlawful, or harmful purposes. All job descriptions, trademarks, company names, and related content remain the property of their respective owners.' },
      { title: '5. Third-Party Links', body: 'This website contains links to third-party websites (employer career pages). We do not control, endorse, or take responsibility for the content, accuracy, availability, or policies of external sites.' },
      { title: '6. Privacy & Data', body: 'When you submit your email address, it is stored for the purpose of sending job-related email notifications. We do not sell or share your email with third parties. You may request deletion of your data at any time by contacting us via the legal page.' },
    ],
  },
  site: {
    documentTitleJobs: 'Browse Tech Jobs in India',
    documentTitleProgress: 'My Progress | Tech Jobs in India',
  },
} as const;

export { BRAND, SKETCH_FONT, PALETTE, COPY };

export default {
  BRAND,
  SKETCH_FONT,
  PALETTE,
  COPY,
};
