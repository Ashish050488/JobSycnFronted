// FILE: src/components/BrandLogo.tsx
// Custom mesh network logo mark + wordmark.
// The icon is a hand-crafted SVG of interconnected nodes forming a diamond mesh.

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
}

const SIZES = {
  sm:  { svg: 22, text: '0.92rem', gap: 5 },
  md:  { svg: 26, text: '1.08rem', gap: 6 },
  lg:  { svg: 36, text: '1.55rem', gap: 8 },
} as const;

/** Custom diamond-mesh SVG — 4 interconnected nodes */
function MeshMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id="meshGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="#40916C" />
        </linearGradient>
      </defs>
      {/* Diamond outline */}
      <path
        d="M16 2 L30 16 L16 30 L2 16 Z"
        stroke="url(#meshGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Internal mesh cross */}
      <line x1="16" y1="2" x2="16" y2="30" stroke="url(#meshGrad)" strokeWidth="1.2" opacity="0.35" />
      <line x1="2" y1="16" x2="30" y2="16" stroke="url(#meshGrad)" strokeWidth="1.2" opacity="0.35" />
      {/* Diagonal mesh lines */}
      <line x1="9" y1="9" x2="23" y2="23" stroke="url(#meshGrad)" strokeWidth="1" opacity="0.25" />
      <line x1="23" y1="9" x2="9" y2="23" stroke="url(#meshGrad)" strokeWidth="1" opacity="0.25" />
      {/* Corner nodes */}
      <circle cx="16" cy="2" r="2.2" fill="url(#meshGrad)" />
      <circle cx="30" cy="16" r="2.2" fill="url(#meshGrad)" />
      <circle cx="16" cy="30" r="2.2" fill="url(#meshGrad)" />
      <circle cx="2" cy="16" r="2.2" fill="url(#meshGrad)" />
      {/* Center node — bigger, glowing */}
      <circle cx="16" cy="16" r="3.5" fill="url(#meshGrad)" opacity="0.2" />
      <circle cx="16" cy="16" r="2.2" fill="url(#meshGrad)" />
      {/* Mid-edge nodes */}
      <circle cx="9" cy="9" r="1.5" fill="url(#meshGrad)" opacity="0.5" />
      <circle cx="23" cy="9" r="1.5" fill="url(#meshGrad)" opacity="0.5" />
      <circle cx="9" cy="23" r="1.5" fill="url(#meshGrad)" opacity="0.5" />
      <circle cx="23" cy="23" r="1.5" fill="url(#meshGrad)" opacity="0.5" />
    </svg>
  );
}

export default function BrandLogo({ size = 'md', compact = false }: BrandLogoProps) {
  const s = SIZES[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      <MeshMark size={s.svg} />
      <span
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Consolas, 'Courier New', monospace",
          fontSize: s.text,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
        }}
      >
        {compact ? (
          <>
            Job<span style={{ color: 'var(--primary)' }}>M</span>
          </>
        ) : (
          <>
            Job<span style={{ color: 'var(--primary)' }}>Mesh</span>
          </>
        )}
      </span>
    </span>
  );
}
