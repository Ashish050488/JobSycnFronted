import { useState, useMemo, useEffect, useRef } from 'react';

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

// ── Logo.dev token ────────────────────────────────────────────
const LOGODEV_TOKEN = import.meta.env.VITE_LOGODEV_TOKEN || '';

// ── Global caches ─────────────────────────────────────────────
const domainCache = new Map<string, string | null>();
const pendingDomain = new Map<string, Promise<string | null>>();
/** Track which logo.dev URLs we've confirmed work (or don't) */
const imgStatusCache = new Map<string, boolean>();

// ── Helpers ───────────────────────────────────────────────────

function getDomainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./i, ''); }
  catch {
    try { return (url || '').trim().replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, ''); }
    catch { return null; }
  }
}

/** Strip legal suffixes and noise to get clean brand name.
 *  "Dell International Services India Pvt Ltd (7451)" → "Dell"
 *  "IPL Labcorp Laboratories India Private Limited" → "Labcorp"
 */
function cleanCompanyName(raw: string): string {
  let s = raw
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/\s*-\s*\d+\s*$/, '')
    .trim();

  const noise = [
    'international', 'incorporated', 'corporation', 'technologies', 'laboratories',
    'consulting', 'solutions', 'private', 'limited', 'services', 'company',
    'global', 'india', 'group', 'tech', 'pvt', 'ltd', 'inc', 'corp',
    'llc', 'llp', 'gmbh', 'co',
  ];
  const noiseRe = new RegExp(`\\b(${noise.join('|')})\\b\\.?`, 'gi');
  s = s.replace(noiseRe, '').replace(/\s{2,}/g, ' ').trim();

  // Keep words that look like brand names (allow alphanumeric like "2070Health", "o2h")
  // Only drop pure numeric tokens or single characters
  const words = s.split(/\s+/).filter(w => w.length >= 2 && !/^\d+$/.test(w));
  if (words.length > 0) s = words.join(' ');

  return s;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function slugFromAtsUrl(url: string): string | null {
  const ats = /greenhouse|lever|workable|recruitee|ashby|boards/i;
  try {
    const u = new URL(url);
    if (!ats.test(u.hostname)) return null;
    const skip = new Set(['jobs', 'job', 'companies', 'company', 'careers', 'openings', 'positions', 'embed', 'apply']);
    for (const seg of u.pathname.split('/').filter(Boolean)) {
      const lo = seg.toLowerCase();
      if (!skip.has(lo) && /^[a-z][a-z0-9-]{1,30}$/.test(lo)) return lo;
    }
  } catch { /* ignore */ }
  return null;
}

function isAtsHost(host: string): boolean {
  return /greenhouse|lever|workable|recruitee|ashby|boards|indeed|monster|ziprecruiter|jobs\.|naukri|linkedin/i.test(host);
}

// ── Clearbit Autocomplete: name → domain ──────────────────────

async function resolveDomainViaAutocomplete(name: string): Promise<string | null> {
  const clean = cleanCompanyName(name);
  if (!clean || clean.length < 2) return null;
  const key = clean.toLowerCase();

  if (domainCache.has(key)) return domainCache.get(key) ?? null;
  if (pendingDomain.has(key)) return pendingDomain.get(key)!;

  const p = (async () => {
    try {
      const res = await fetch(
        `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(clean)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].domain) {
          const d: string = data[0].domain;
          domainCache.set(key, d);
          return d;
        }
      }
    } catch { /* CORS or network error */ }
    domainCache.set(key, null);
    return null;
  })();

  pendingDomain.set(key, p);
  const r = await p;
  pendingDomain.delete(key);
  return r;
}

// ── Logo.dev URL builder ──────────────────────────────────────
function logoDevUrl(domain: string): string {
  return `https://img.logo.dev/${domain}?token=${LOGODEV_TOKEN}&size=128&format=png`;
}

// ── Preload an image and return whether it loaded ─────────────
function preloadImg(src: string): Promise<boolean> {
  if (imgStatusCache.has(src)) return Promise.resolve(imgStatusCache.get(src)!);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { imgStatusCache.set(src, true); resolve(true); };
    img.onerror = () => { imgStatusCache.set(src, false); resolve(false); };
    img.src = src;
  });
}

// ── Main Component ────────────────────────────────────────────

export default function CompanyLogo({ name, url, domain, size = 40, borderRadius = 8, className, style, alt }: Props) {
  const host = useMemo(() => domain || getDomainFromUrl(url || ''), [domain, url]);
  const mountRef = useRef(true);

  // Build candidate domains to try (fast guesses)
  const candidates = useMemo(() => {
    const list: string[] = [];

    // 1. ATS slug → slug.com
    if (url) {
      const slug = slugFromAtsUrl(url);
      if (slug) list.push(`${slug}.com`);
    }

    // 2. Real company domain from URL
    if (host && !isAtsHost(host)) list.push(host);

    // 3. Name-based guesses
    if (name) {
      const clean = cleanCompanyName(name);
      const slug = slugify(clean);
      if (slug && slug.length >= 2 && slug.length < 25) {
        list.push(`${slug}.com`);
        list.push(`${slug}.co`);
        list.push(`${slug}.io`);
        list.push(`${slug}.in`);
      }
    }

    // Deduplicate
    return [...new Set(list)];
  }, [host, url, name]);

  // State
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  // Reset on company change
  useEffect(() => {
    setLogoSrc(null);
    setResolved(false);
    mountRef.current = true;
    return () => { mountRef.current = false; };
  }, [name, url, domain]);

  // Resolve the best logo: race candidates + Clearbit Autocomplete
  useEffect(() => {
    if (resolved) return;
    let done = false;
    let guessedSrc: string | null = null;

    const tryDomain = async (d: string, isAutocomplete = false) => {
      const src = logoDevUrl(d);
      const ok = await preloadImg(src);
      if (!ok || !mountRef.current) return;

      if (isAutocomplete) {
        // Autocomplete is authoritative — always wins, even overriding a guess
        done = true;
        setLogoSrc(src);
        setResolved(true);
      } else if (!done) {
        // Guess — accept but autocomplete can still override
        guessedSrc = src;
        setLogoSrc(src);
      }
    };

    // Strategy 1: Try all candidate domains in parallel via logo.dev
    candidates.forEach(d => tryDomain(d, false));

    // Strategy 2: Clearbit Autocomplete (gets exact domain like apna.co)
    if (name) {
      resolveDomainViaAutocomplete(name).then(d => {
        if (d && mountRef.current) {
          // If autocomplete returned a domain we already guessed, just lock it in
          const acSrc = logoDevUrl(d);
          if (acSrc === guessedSrc) {
            done = true;
            setResolved(true);
          } else {
            tryDomain(d, true);
          }
        }
      });
    }

    // Timeout: if nothing resolved in 6s, accept whatever we have or fail
    const timer = setTimeout(() => {
      if (!done && mountRef.current) {
        done = true;
        if (guessedSrc) setLogoSrc(guessedSrc);
        setResolved(true);
      }
    }, 6000);

    return () => { clearTimeout(timer); done = true; };
  }, [candidates, name, resolved]);

  // Container
  const containerStyle: React.CSSProperties = {
    width: size, height: size, borderRadius,
    background: 'var(--surface-solid, #fff)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
    padding: Math.round(size * 0.1),
    boxSizing: 'border-box' as const,
    ...style,
  };

  const letterEl = (opacity = 1) => (
    <span style={{
      fontFamily: "'Playfair Display',serif",
      fontSize: size * 0.5, color: 'var(--primary)',
      fontWeight: 700, lineHeight: 1, opacity,
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );

  return (
    <div className={className} style={containerStyle} aria-label={alt || name || 'company logo'}>
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={alt || name}
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          onError={() => { setLogoSrc(null); setResolved(true); }}
        />
      ) : resolved ? (
        letterEl()
      ) : (
        letterEl(0.4)
      )}
    </div>
  );
}
