import { useState } from 'react';
import { Mail, Shield, FileText, Eye, Trash2, Database, Globe, Lock, ChevronDown, Zap } from 'lucide-react';
import { Container, Divider } from '../components/ui';
import { BRAND } from '../theme/brand';

/* ─── Section data ─────────────────────────────────────────────── */

const TERMS_SECTIONS = [
  {
    icon: <Globe size={18} />,
    title: 'Project Purpose',
    body: `${BRAND.appName} is operated by Layer3 Studios and is a non-commercial project created to aggregate and surface tech job opportunities across India. Our goal is to make it easier for software engineers, data scientists, DevOps professionals, and other tech workers to discover relevant roles at top Indian companies.\n\nAll information on this site is for informational and educational purposes only. This site does not provide recruitment, hiring, legal, immigration, or career advisory services. We are not a recruitment agency, do not represent any employers, and do not guarantee interviews, responses, or job offers.`,
  },
  {
    icon: <Database size={18} />,
    title: 'How Job Listings Work',
    body: `Job listings are aggregated using automated systems that scrape publicly available career pages from company websites and Applicant Tracking Systems (ATS) including Lever, Greenhouse, Ashby, Workable, Recruitee, and Workday.\n\nListings are refreshed daily. However, job details may change or become outdated at any time. Requirements, compensation, and availability are controlled entirely by the respective employers. Users are responsible for verifying all job details directly with the employer before applying.\n\nAll job descriptions, trademarks, company names, logos, and related content remain the intellectual property of their respective owners.`,
  },
  {
    icon: <FileText size={18} />,
    title: 'Use of the Website',
    body: `You may use this website for personal, non-commercial purposes only. By using ${BRAND.appName}, you agree not to:\n\n• Scrape, copy, or redistribute job listings in bulk\n• Republish or commercialise site content\n• Use the site for misleading, unlawful, or harmful purposes\n• Attempt to access other users' data or circumvent authentication\n• Use automated tools to overwhelm our servers\n\nWe reserve the right to suspend or terminate access for users who violate these terms.`,
  },
  {
    icon: <Globe size={18} />,
    title: 'Third-Party Links',
    body: `This website contains links to third-party websites, primarily employer career pages and application portals. We do not control, endorse, or take responsibility for the content, accuracy, availability, privacy practices, or policies of any external sites.\n\nWhen you click "Apply Now" on any job listing, you are leaving ${BRAND.appName} and interacting directly with the employer's website. Any information you submit on those sites is governed by their respective privacy policies.`,
  },
];

const PRIVACY_SECTIONS = [
  {
    icon: <Eye size={18} />,
    title: 'Information We Collect',
    body: `When you sign in with Google, we receive and store the following information from your Google profile:\n\n• Your name\n• Your email address\n• Your profile picture URL\n• Your unique Google account identifier\n\nWe do not access your Gmail inbox, contacts, calendar, Drive, or any other Google service data beyond what is listed above. We use the minimum scope necessary ("openid", "email", "profile") for authentication only.\n\nAdditionally, we collect data you voluntarily provide while using the app:\n\n• Skills you add to your profile (up to 30)\n• Jobs you mark as "Applied" and their timestamps\n• Jobs you bookmark with "Come Back Later" notes\n• Your daily application goal setting\n• Application pipeline stage updates and notes`,
  },
  {
    icon: <Database size={18} />,
    title: 'How We Use Your Data',
    body: `Your data is used exclusively to provide the ${BRAND.appName} service. Specifically:\n\n• Google profile data — to identify you and display your name and avatar in the app\n• Skills — to highlight matching skills in job descriptions\n• Applied jobs — to track your application progress, calculate streaks, and show stats\n• Bookmarks and notes — to help you organise your job search\n• Daily goal — to power the progress tracking features\n\nWe do not use your data for advertising, profiling, selling to third parties, training AI models, or any purpose other than operating the features you directly interact with.`,
  },
  {
    icon: <Lock size={18} />,
    title: 'Data Storage & Security',
    body: `Your data is stored in a MongoDB database hosted on secure infrastructure. Authentication tokens are stored as httpOnly, Secure, SameSite cookies — they are not accessible to JavaScript and cannot be stolen via cross-site scripting (XSS) attacks.\n\nPasswords are never collected or stored because we use Google OAuth exclusively for authentication.\n\nAll connections to ${BRAND.appName} are encrypted via HTTPS/TLS. We implement standard security practices including input validation, parameterised database queries, and rate limiting.\n\nWhile we take reasonable measures to protect your data, no system is 100% secure. We cannot guarantee absolute security of your information.`,
  },
  {
    icon: <Shield size={18} />,
    title: 'Google API Services Usage Disclosure',
    body: `${BRAND.appName} uses Google API Services for user authentication via Google Sign-In.\n\n${BRAND.appName}'s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.\n\nSpecifically:\n\n• We only request the scopes necessary for authentication (openid, email, profile)\n• We do not use Google user data for serving advertisements\n• We do not allow humans to read your Google data unless you give affirmative consent, it is necessary for security purposes, or it is required by law\n• We do not transfer or sell Google user data to third parties\n\nFor more information, see Google's API Services User Data Policy at: https://developers.google.com/terms/api-services-user-data-policy`,
  },
  {
    icon: <Trash2 size={18} />,
    title: 'Data Retention & Deletion',
    body: `Your account data is retained as long as you have an active account. Job application tracking data is retained to provide you with historical stats and progress tracking.\n\nYou may request complete deletion of your account and all associated data at any time by emailing us at layer3studios.team@gmail.com. Upon receiving a deletion request, we will:\n\n• Delete your user profile (name, email, Google ID)\n• Delete all your applied jobs, skills, bookmarks, and notes\n• Delete your authentication tokens\n• Complete the deletion within 30 days\n\nAlternatively, you can sign out at any time. Signing out clears your session but does not delete your stored data.`,
  },
  {
    icon: <Eye size={18} />,
    title: 'Cookies',
    body: `${BRAND.appName} uses the following cookies:\n\n• tj_token — An authentication cookie containing your encrypted session token. This is an httpOnly cookie that cannot be accessed by JavaScript. It expires after 7 days, after which you will need to sign in again.\n• ej-theme — A localStorage entry (not a cookie) that stores your light/dark mode preference. This never leaves your browser.\n\nWe do not use advertising cookies, analytics cookies, or any third-party tracking cookies. We do not use Google Analytics or any similar service.`,
  },
  {
    icon: <Globe size={18} />,
    title: 'Children\'s Privacy',
    body: `${BRAND.appName} is intended for use by individuals who are at least 18 years of age or the legal age of majority in their jurisdiction. We do not knowingly collect personal information from anyone under 18. If we learn that we have collected personal information from a child under 18, we will take steps to delete that information promptly.`,
  },
  {
    icon: <FileText size={18} />,
    title: 'Changes to This Policy',
    body: `We may update this privacy policy from time to time. Any changes will be reflected on this page with an updated "Last updated" date. Continued use of ${BRAND.appName} after changes constitutes acceptance of the revised policy.\n\nFor significant changes that affect how we handle your data, we will make reasonable efforts to notify you via the app or email.`,
  },
];

/* ─── Collapsible section component ────────────────────────────── */

function Section({ icon, title, body, defaultOpen = false }: { icon: React.ReactNode; title: string; body: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      border: '1.25px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 0.22s',
      ...(open ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary-soft)' } : {}),
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '18px 20px',
          background: open ? 'var(--primary-soft)' : 'var(--surface-solid)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.22s',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: open ? 'var(--primary)' : 'var(--paper2)',
          color: open ? '#fff' : 'var(--muted-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.22s',
        }}>
          {icon}
        </div>
        <span style={{
          flex: 1,
          fontSize: '0.95rem',
          fontWeight: 700,
          color: 'var(--ink)',
        }}>
          {title}
        </span>
        <div style={{ color: 'var(--muted-ink)', flexShrink: 0, transition: 'transform 0.22s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <ChevronDown size={18} />
        </div>
      </button>

      {open && (
        <div style={{
          padding: '20px 24px 24px',
          background: 'var(--surface-solid)',
          borderTop: '1px solid var(--border)',
        }}>
          {body.split('\n\n').map((paragraph, i) => (
            <p key={i} style={{
              fontSize: '0.88rem',
              color: 'var(--muted-ink)',
              lineHeight: 1.85,
              marginBottom: i < body.split('\n\n').length - 1 ? 16 : 0,
              whiteSpace: 'pre-line',
            }}>
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Tab component ────────────────────────────────────────────── */

type Tab = 'terms' | 'privacy';

/* ─── Main page ────────────────────────────────────────────────── */

export default function Legal() {
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  const tabStyle = (tab: Tab) => ({
    padding: '10px 22px',
    borderRadius: 999,
    border: activeTab === tab ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
    background: activeTab === tab ? 'var(--primary)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--muted-ink)',
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: '0.88rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.22s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  });

  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh' }}>
      {/* ── Header ───────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-solid)',
        borderBottom: '1.25px solid var(--border)',
        padding: '48px 0 40px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.25,
          pointerEvents: 'none',
        }} />
        <Container size="md" style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'var(--primary-soft)',
              border: '1.5px solid var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={18} color="var(--primary)" />
            </div>
          </div>
          <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>Legal & Privacy</p>
          <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 8 }}>
            Terms & Privacy<br /><span style={{ color: 'var(--primary)' }}>Policy</span>
          </h1>
          <p style={{ color: 'var(--muted-ink)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 16 }}>
            How we handle your data and what you agree to by using TechJobs
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--subtle-ink)', background: 'var(--paper2)', padding: '4px 12px', borderRadius: 999, border: '1px solid var(--border)' }}>
              Last updated: March 2026
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--subtle-ink)', background: 'var(--paper2)', padding: '4px 12px', borderRadius: 999, border: '1px solid var(--border)' }}>
              🇮🇳 India
            </span>
          </div>
        </Container>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <Container size="md" style={{ padding: '32px 24px 64px' }}>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 10,
          marginBottom: 32,
          position: 'sticky',
          top: 68,
          zIndex: 10,
          padding: '12px 0',
          background: 'var(--paper)',
        }}>
          <button onClick={() => setActiveTab('terms')} style={tabStyle('terms')}>
            <FileText size={15} /> Terms of Use
          </button>
          <button onClick={() => setActiveTab('privacy')} style={tabStyle('privacy')}>
            <Lock size={15} /> Privacy Policy
          </button>
        </div>

        {/* Quick summary card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-soft), transparent 60%)',
          border: '1.25px solid var(--primary)',
          borderRadius: 16,
          padding: '22px 24px',
          marginBottom: 24,
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginBottom: 6 }}>
              {activeTab === 'terms' ? 'TL;DR — Terms' : 'TL;DR — Privacy'}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-ink)', lineHeight: 1.7 }}>
              {activeTab === 'terms'
                ? 'TechJobs aggregates tech job listings from Indian companies. We\'re not a recruiter. Job data comes from public career pages and may change. Use the site for personal job searching only.'
                : 'We collect your Google name, email, and profile picture for login. We store your skills, applied jobs, and notes to power the tracker. We don\'t read your Gmail, sell your data, or use tracking cookies. You can delete everything anytime.'
              }
            </p>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS).map((section, i) => (
            <Section
              key={`${activeTab}-${i}`}
              icon={section.icon}
              title={section.title}
              body={section.body}
              defaultOpen={i === 0}
            />
          ))}
        </div>

        <Divider style={{ margin: '40px 0 32px' }} />

        {/* ── Contact card ────────────────────────────────── */}
        <div style={{
          border: '1.25px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-soft), var(--surface-solid))',
            padding: '28px 24px',
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Mail size={22} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
                Contact Us
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted-ink)', lineHeight: 1.7, marginBottom: 12 }}>
                For questions, data deletion requests, privacy concerns, or legal enquiries, reach out to us. We typically respond within 48 hours.
              </p>
              <a
                href="mailto:layer3studios.team@gmail.com"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'all 0.22s',
                }}
              >
                <Mail size={15} />
                layer3studios.team@gmail.com
              </a>
            </div>
          </div>

          <div style={{
            padding: '16px 24px',
            background: 'var(--surface-solid)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 24,
            flexWrap: 'wrap',
            fontSize: '0.8rem',
            color: 'var(--subtle-ink)',
          }}>
            <span>🏢 Layer3 Studios</span>
            <span>🇮🇳 Based in India</span>
            <span>📧 Data deletion within 30 days</span>
          </div>
        </div>

        {/* ── Jurisdiction note ────────────────────────────── */}
        <div style={{
          textAlign: 'center',
          marginTop: 32,
          padding: '16px 20px',
          background: 'var(--paper2)',
          borderRadius: 12,
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--subtle-ink)', lineHeight: 1.7 }}>
            This service is operated from India and is intended for users based in India.
            By using {BRAND.appName}, you consent to the processing of your data as described in this policy.
            These terms are governed by and construed in accordance with the laws of India.
            Any disputes shall be subject to the exclusive jurisdiction of the courts in India.
          </p>
        </div>
      </Container>
    </div>
  );
}