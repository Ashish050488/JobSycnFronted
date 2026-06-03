// FILE: src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Spinner } from './Spinner';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'outline' | 'secondary';

const BTN_BASE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  fontFamily: 'inherit', fontWeight: 500, letterSpacing: '-0.005em',
  border: '1px solid transparent', borderRadius: 10, cursor: 'pointer',
  textDecoration: 'none', lineHeight: 1,
  transition: 'all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent',
};

const BTN_SIZE: Record<Size, CSSProperties> = {
  sm: { fontSize: '0.8125rem', padding: '7px 14px', minHeight: 32 },
  md: { fontSize: '0.875rem', padding: '9px 18px', minHeight: 38 },
  lg: { fontSize: '0.9375rem', padding: '12px 22px', minHeight: 44 },
};

const BTN_VARIANT: Record<Variant, CSSProperties> = {
  primary: { background: 'var(--ink)', color: 'var(--paper)', borderColor: 'var(--ink)' },
  secondary: { background: 'var(--paper-2)', color: 'var(--ink)', borderColor: 'var(--border)' },
  ghost: { background: 'transparent', color: 'var(--ink-2)', borderColor: 'var(--border)' },
  outline: { background: 'transparent', color: 'var(--ink)', borderColor: 'var(--border-strong)' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)', borderColor: 'transparent' },
  success: { background: 'var(--success-soft)', color: 'var(--success)', borderColor: 'transparent' },
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size; loading?: boolean;
  as?: 'button' | 'a'; href?: string; children: ReactNode;
  target?: string; rel?: string; download?: string | boolean;
}

export function Button({
  variant = 'primary', size = 'md', loading, children, style,
  as: Tag = 'button', href, className = '', ...rest
}: ButtonProps & { className?: string }) {
  const merged: CSSProperties = {
    ...BTN_BASE, ...BTN_SIZE[size], ...BTN_VARIANT[variant],
    ...(loading ? { opacity: 0.65, cursor: 'not-allowed' } : {}),
    ...style,
  };
  if (Tag === 'a') {
    return <a href={href} className={className} style={merged} {...(rest as any)}>{loading ? <Spinner size={14} /> : children}</a>;
  }
  return (
    <button disabled={loading || rest.disabled} className={className} style={merged} {...rest}>
      {loading ? <Spinner size={14} /> : children}
    </button>
  );
}
