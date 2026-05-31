// FILE: src/components/CompanyLogo.tsx
// Resolves a company's logo via ATS slug → guessed domain → Clearbit autocomplete → logo.dev.
// API surface preserved; visual shell modernized.

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

const LOGODEV_TOKEN = (import.meta as any).env?.VITE_LOGODEV_TOKEN || '';

const domainCache = new Map<string, string | null>();
const pendingDomain = new Map<string, Promise<string | null>>();
const imgStatusCache = new Map<string, boolean>();

function getDomainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./i, ''); }
  catch {
    try { return (url || '').trim().replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, ''); }
    catch { return null; }
  }
}

function cleanCompanyName(raw: string): string {
  let s = raw.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*-\s*\d+\s*$/, '').trim();
  const noise = ['international', 'incorporated', 'corporation', 'technologies', 'laboratories',
    'consulting', 'solutions', 'private', 'limited', 'services', 'company',
    'global', 'india', 'group', 'tech', 'pvt', 'ltd', 'inc', 'corp',
    'llc', 'llp', 'gmbh', 'co'];
  const noiseRe = new RegExp(`\\b(${noise.join('|')})\\b\\.?`, 'gi');
  s = s.replace(noiseRe, '').replace(/\s{2,}/g, ' ').trim();
  const words = s.split(/\s+/).filter(w => w.length >= 2 && !/^\d+$/.test(w));
  if (words.length > 0) s = words.join(' ');
  return s;
}

function slugify(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, ''); }

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

async function resolveDomainViaAutocomplete(name: string): Promise<string | null> {
  const clean = cleanCompanyName(name);
  if (!clean || clean.length < 2) return null;
  const key = clean.toLowerCase();
  if (domainCache.has(key)) return domainCache.get(key) ?? null;
  if (pendingDomain.has(key)) return pendingDomain.get(key)!;

  const p = (async () => {
    try {
      const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].domain) {
          domainCache.set(key, data[0].domain);
          return data[0].domain as string;
        }
      }
    } catch { /* CORS or net */ }
    domainCache.set(key, null);
    return null;
  })();
  pendingDomain.set(key, p);
  const r = await p;
  pendingDomain.delete(key);
  return r;
}

function logoDevUrl(domain: string): string {
  return `https://img.logo.dev/${domain}?token=${LOGODEV_TOKEN}&size=128&format=png`;
}

function preloadImg(src: string): Promise<boolean> {
  if (imgStatusCache.has(src)) return Promise.resolve(imgStatusCache.get(src)!);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { imgStatusCache.set(src, true); resolve(true); };
    img.onerror = () => { imgStatusCache.set(src, false); resolve(false); };
    img.src = src;
  });
}

export default function CompanyLogo({ name, url, domain, size = 40, borderRadius = 10, className, style, alt }: Props) {
  const host = useMemo(() => domain || getDomainFromUrl(url || ''), [domain, url]);
  const mountRef = useRef(true);

  const candidates = useMemo(() => {
    const list: string[] = [];
    if (url) {
      const slug = slugFromAtsUrl(url);
      if (slug) list.push(`${slug}.com`);
    }
    if (host && !isAtsHost(host)) list.push(host);
    if (name) {
      const clean = cleanCompanyName(name);
      const slug = slugify(clean);
      if (slug && slug.length >= 2 && slug.length < 25) {
        list.push(`${slug}.com`); list.push(`${slug}.co`); list.push(`${slug}.io`); list.push(`${slug}.in`);
      }
    }
    return [...new Set(list)];
  }, [host, url, name]);

  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setLogoSrc(null); setResolved(false);
    mountRef.current = true;
    return () => { mountRef.current = false; };
  }, [name, url, domain]);

  useEffect(() => {
    if (resolved) return;
    let done = false;
    let guessedSrc: string | null = null;

    const tryDomain = async (d: string, isAutocomplete = false) => {
      const src = logoDevUrl(d);
      const ok = await preloadImg(src);
      if (!ok || !mountRef.current) return;
      if (isAutocomplete) {
        done = true; setLogoSrc(src); setResolved(true);
      } else if (!done) {
        guessedSrc = src; setLogoSrc(src);
      }
    };

    candidates.forEach(d => tryDomain(d, false));
    if (name) {
      resolveDomainViaAutocomplete(name).then(d => {
        if (d && mountRef.current) {
          const acSrc = logoDevUrl(d);
          if (acSrc === guessedSrc) { done = true; setResolved(true); }
          else tryDomain(d, true);
        }
      });
    }
    const timer = setTimeout(() => {
      if (!done && mountRef.current) {
        done = true;
        if (guessedSrc) setLogoSrc(guessedSrc);
        setResolved(true);
      }
    }, 6000);
    return () => { clearTimeout(timer); done = true; };
  }, [candidates, name, resolved]);

  const containerStyle: React.CSSProperties = {
    width: size, height: size, borderRadius,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
    padding: Math.round(size * 0.12),
    boxSizing: 'border-box',
    ...style,
  };

  const letterEl = (opacity = 1) => (
    <span style={{
      fontFamily: "'Source Serif 4', Georgia, ui-serif, serif",
      fontSize: size * 0.5,
      color: 'var(--accent)',
      fontWeight: 600,
      lineHeight: 1,
      opacity,
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
      ) : resolved ? letterEl() : letterEl(0.45)}
    </div>
  );
}
