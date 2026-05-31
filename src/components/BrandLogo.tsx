// FILE: src/components/BrandLogo.tsx
// Minimal monogram + wordmark. Notion-style: small icon, refined typography.

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

const SIZES = {
  sm: { svg: 20, text: '0.95rem', gap: 7 },
  md: { svg: 24, text: '1.05rem', gap: 8 },
  lg: { svg: 36, text: '1.5rem', gap: 10 },
} as const;

function Mark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* Rounded square base */}
      <rect x="2" y="2" width="28" height="28" rx="7" fill="var(--accent)" />
      {/* Subtle highlight edge */}
      <rect x="2" y="2" width="28" height="28" rx="7" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      {/* Diamond mesh nodes */}
      <circle cx="16" cy="9" r="1.6" fill="#fff" />
      <circle cx="23" cy="16" r="1.6" fill="#fff" />
      <circle cx="16" cy="23" r="1.6" fill="#fff" />
      <circle cx="9" cy="16" r="1.6" fill="#fff" />
      {/* Connecting lines */}
      <path d="M16 10.6 L23 14.4 M23 17.6 L16 21.4 M14.4 22.5 L10 17.5 M10 14.5 L14.4 9.5"
            stroke="rgba(255,255,255,0.85)" strokeWidth="1.3" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="16" cy="16" r="2.2" fill="#fff" />
    </svg>
  );
}

export default function BrandLogo({ size = 'md', compact = false }: BrandLogoProps) {
  const s = SIZES[size];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap,
      lineHeight: 1,
      userSelect: 'none',
    }}>
      <Mark size={s.svg} />
      <span style={{
        fontFamily: "'Source Serif 4', 'Iowan Old Style', Georgia, ui-serif, serif",
        fontSize: s.text,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: 'var(--ink)',
      }}>
        {compact ? 'Job' : (<>Job<span style={{ color: 'var(--accent)' }}>mesh</span></>)}
      </span>
    </span>
  );
}
