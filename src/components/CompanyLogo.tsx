import { useState, useMemo, useEffect } from 'react';
import { LogoImg } from './ui';

interface Props {
  name?: string;
  url?: string | null;
  domain?: string | null;
  size?: number;
  borderRadius?: number | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

function getDomainFromUrl(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./i, '');
  } catch {
    try {
      const s = (url || '').trim();
      return s.replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, '');
    } catch {
      return null;
    }
  }
}

function pickBgColor(name?: string) {
  const palette = ['#E6F4EA', '#FFF6E6', '#F4E8FF', '#E8F8FF', '#FFF0F0', '#F3F4F6', '#FFF9E6'];
  if (!name) return palette[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % palette.length;
  return palette[h];
}

export default function CompanyLogo({ name, url, domain, size = 40, borderRadius = 8, className, style, alt }: Props) {
  const host = useMemo(() => domain || getDomainFromUrl(url || ''), [domain, url]);

  const sources = useMemo(() => {
    const s: string[] = [];

    const atsPattern = /greenhouse|lever|workable|recruitee|ashby|jobs|boards|ats|ziprecruiter|indeed|monster/i;

    // If host appears to be a job-board / ATS, try to extract a company slug
    // from the URL path and probe common domain variants (slug, slug.com, slug.io).
    if (host && atsPattern.test(host) && url) {
      try {
        const u = new URL(url);
        const segments = u.pathname.split('/').map(s => s.trim().toLowerCase()).filter(Boolean);
        const blacklist = new Set(['jobs', 'job', 'companies', 'company', 'careers', 'openings', 'positions']);
        let slug: string | undefined = undefined;
        for (const seg of segments) {
          if (!blacklist.has(seg) && /^[a-z0-9-]+$/.test(seg)) { slug = seg; break; }
        }

        if (slug) {
          const candidates = [slug, `${slug}.com`, `${slug}.io`, `${slug}.co`, `${slug}.in`];
          for (const c of candidates) {
            s.push(`https://logo.clearbit.com/${c}?size=${Math.max(64, size)}`);
            s.push(`https://icons.duckduckgo.com/ip3/${c}.ico`);
          }
          s.push(`https://www.google.com/s2/favicons?sz=${Math.max(64, size)}&domain=${slug}`);
          return s;
        }
        // if no slug, continue to try host-based or name-based fallbacks
      } catch {
        // continue
      }
    }

    // If we have a real host (not an ATS) try host-based logos first
    if (host) {
      s.push(`https://logo.clearbit.com/${host}?size=${Math.max(64, size)}`);
      s.push(`https://icons.duckduckgo.com/ip3/${host}.ico`);
      s.push(`https://www.google.com/s2/favicons?sz=${Math.max(64, size)}&domain=${host}`);
      s.push(`https://logo.clearbit.com/${host}`);
    }

    // If nothing found yet, or host was not provided, try deriving a domain from the company name
    if (s.length === 0 && name) {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '');
      if (slug) {
        const candidates = [`${slug}.com`, `${slug}.io`, `${slug}.co`, slug];
        for (const c of candidates) {
          s.push(`https://logo.clearbit.com/${c}?size=${Math.max(64, size)}`);
          s.push(`https://icons.duckduckgo.com/ip3/${c}.ico`);
        }
        s.push(`https://www.google.com/s2/favicons?sz=${Math.max(64, size)}&domain=${slug}`);
      }
    }

    return s;
  }, [host, size, url, name]);

  // reset index/loaded when sources list changes
  useEffect(() => { setIndex(0); setLoaded(false); }, [sources.length]);

  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const onError = () => setIndex(i => i + 1);

  const showLetter = index >= sources.length || !sources.length;

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: typeof borderRadius === 'number' ? borderRadius : borderRadius,
    background: pickBgColor(name),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...style,
  };

  return (
    <div className={className} style={containerStyle} aria-label={alt || name || 'company logo'}>
      {showLetter ? (
        // Try Clearbit autocomplete by company name as a secondary fallback
        name ? (
          <LogoImg companyName={name} size={size} />
        ) : (
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: size * 0.55, color: 'var(--primary)', fontWeight: 700 }}>
            {(name || '?').charAt(0)}
          </span>
        )
      ) : (
        <>
          <img
            src={sources[index]}
            alt={alt || name}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: loaded ? 'block' : 'none' }}
            onLoad={() => setLoaded(true)}
            onError={onError}
          />
          {!loaded && (
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: size * 0.55, color: 'var(--primary)', fontWeight: 700 }}>
              {(name || '?').charAt(0)}
            </span>
          )}
        </>
      )}
    </div>
  );
}
