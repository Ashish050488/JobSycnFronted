// ─── Design System UI Primitives ─────────────────────────────────────
// Notion paper aesthetic with Apple-grade polish.
// All runtime styling reads from CSS variables set by ThemeProvider.

import {
  type ReactNode, type CSSProperties, type ButtonHTMLAttributes,
  type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes,
  forwardRef,
} from 'react';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'outline' | 'secondary';
type BadgeVariant = 'primary' | 'green' | 'red' | 'yellow' | 'blue' | 'neutral' | 'acid';

// ── Container ────────────────────────────────────────────────────────
export function Container({ children, size = 'xl', style, className = '' }: {
  children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; style?: CSSProperties; className?: string;
}) {
  const maxW = { sm: '640px', md: '768px', lg: '1024px', xl: '1200px' }[size];
  return (
    <div
      className={className}
      style={{ maxWidth: maxW, margin: '0 auto', padding: '0 clamp(16px, 4vw, 24px)', ...style }}
    >
      {children}
    </div>
  );
}

// ── Stack ─────────────────────────────────────────────────────────────
export function Stack({ children, gap = 16, dir = 'col', align, justify, wrap, className = '' }: {
  children: ReactNode; gap?: number; dir?: 'row' | 'col'; align?: string; justify?: string; wrap?: boolean; className?: string;
}) {
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: dir === 'col' ? 'column' : 'row', gap, alignItems: align, justifyContent: justify, flexWrap: wrap ? 'wrap' : undefined }}
    >
      {children}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────
const BTN_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  fontFamily: 'inherit',
  fontWeight: 500,
  letterSpacing: '-0.005em',
  border: '1px solid transparent',
  borderRadius: 10,
  cursor: 'pointer',
  textDecoration: 'none',
  lineHeight: 1,
  transition: 'all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
  whiteSpace: 'nowrap',
  WebkitTapHighlightColor: 'transparent',
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
    <button
      disabled={loading || rest.disabled}
      className={className}
      style={merged}
      {...rest}
    >
      {loading ? <Spinner size={14} /> : children}
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

// ── Input ─────────────────────────────────────────────────────────────
const INPUT_STYLE: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontFamily: 'inherit',
  fontSize: '0.9375rem',
  background: 'var(--surface)',
  color: 'var(--ink)',
  border: '1px solid var(--border-strong)',
  borderRadius: 10,
  outline: 'none',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
};

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, className = '', ...rest }, ref) => (
    <div style={{ width: '100%' }}>
      <input
        ref={ref}
        className={className}
        style={{ ...INPUT_STYLE, ...(error ? { borderColor: 'var(--danger)' } : {}), ...style }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
        {...rest}
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
    </div>
  )
);

// ── Textarea ──────────────────────────────────────────────────────────
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, className = '', ...rest }, ref) => (
    <div style={{ width: '100%' }}>
      <textarea
        ref={ref}
        className={className}
        style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 100, ...style }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
        {...rest}
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
    </div>
  )
);

// ── Select ────────────────────────────────────────────────────────────
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, children, className = '', ...rest }, ref) => (
    <div style={{ width: '100%', position: 'relative' }}>
      <select
        ref={ref}
        className={className}
        style={{
          ...INPUT_STYLE,
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%236F6E69' stroke-width='2'%3E%3Cpath d='M3 5l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: 32,
          cursor: 'pointer',
          ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
        {...rest}
      >
        {children}
      </select>
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
    </div>
  )
);

// ── Card ──────────────────────────────────────────────────────────────
export function Card({ children, hoverable, style, onClick, className = '' }: {
  children: ReactNode; hoverable?: boolean; style?: CSSProperties; onClick?: () => void; className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`card ${hoverable ? 'hover' : ''} ${className}`}
      style={{ padding: 'clamp(16px, 3vw, 22px)', ...style }}
    >
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────
const BADGE_STYLE: Record<BadgeVariant, CSSProperties> = {
  primary: { background: 'var(--accent-soft)', color: 'var(--accent)' },
  green: { background: 'var(--success-soft)', color: 'var(--success)' },
  red: { background: 'var(--danger-soft)', color: 'var(--danger)' },
  yellow: { background: 'var(--warning-soft)', color: 'var(--warning)' },
  blue: { background: 'var(--info-soft)', color: 'var(--info)' },
  neutral: { background: 'var(--paper-2)', color: 'var(--ink-muted)' },
  acid: { background: 'var(--accent-soft)', color: 'var(--accent)' },
};

export function Badge({ children, variant = 'neutral', style }: { children: ReactNode; variant?: BadgeVariant; style?: CSSProperties }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 999,
      fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 600,
      letterSpacing: '-0.005em',
      whiteSpace: 'nowrap',
      border: '1px solid transparent',
      ...BADGE_STYLE[variant], ...style,
    }}>
      {children}
    </span>
  );
}

// ── Label ─────────────────────────────────────────────────────────────
export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: 'block', marginBottom: 6,
      fontSize: '0.78rem', fontWeight: 500,
      color: 'var(--ink-muted)',
    }}>
      {children}
    </label>
  );
}

// ── Divider ───────────────────────────────────────────────────────────
export function Divider({ style }: { style?: CSSProperties }) {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', ...style }} />;
}

// ── PageHeader (Notion-style: serif title, soft eyebrow, optional actions) ──
export function PageHeader({ label, title, subtitle, actions }: {
  label?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <p style={{
          fontSize: '0.75rem', fontWeight: 500,
          color: 'var(--ink-muted)',
          marginBottom: 6,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {label}
        </p>
      )}
      <div style={{
        display: 'flex',
        justifyContent: actions ? 'space-between' : 'flex-start',
        alignItems: 'flex-end',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ minWidth: 0, flex: '1 1 280px' }}>
          <h1 className="font-display" style={{
            fontSize: 'clamp(1.6rem, 3.6vw, 2.25rem)',
            fontWeight: 600,
            color: 'var(--ink)',
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
          }}>
            {title}
          </h1>
          {subtitle && (
            <div style={{ color: 'var(--ink-muted)', marginTop: 6, fontSize: '0.875rem', lineHeight: 1.55 }}>
              {subtitle}
            </div>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────────────
export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p style={{ color: 'var(--ink-faint)', fontSize: '0.75rem', marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────
export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'clamp(40px, 8vw, 64px) clamp(20px, 4vw, 32px)',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
    }}>
      {icon && <div style={{ color: 'var(--ink-faint)', marginBottom: 14, display: 'flex', justifyContent: 'center' }}>{icon}</div>}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{title}</h3>
      {body && <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', maxWidth: 380, margin: '0 auto 18px', lineHeight: 1.55 }}>{body}</p>}
      {action}
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children }: { type?: 'success' | 'error' | 'warning' | 'info'; children: ReactNode }) {
  const colorMap = {
    success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
    error: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
    warning: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  }[type];
  return (
    <div style={{
      padding: '11px 14px',
      borderRadius: 10,
      fontSize: '0.875rem',
      fontWeight: 500,
      background: colorMap.bg,
      color: colorMap.fg,
    }}>
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────
export function StatCard({ icon, value, label, accent }: { icon: ReactNode; value: ReactNode; label: string; accent?: boolean }) {
  return (
    <Card style={{
      textAlign: 'left',
      borderColor: accent ? 'var(--accent-mid)' : 'var(--border)',
      background: accent ? 'linear-gradient(135deg, var(--accent-soft), var(--surface))' : 'var(--surface)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: accent ? 'var(--accent-soft)' : 'var(--paper-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent ? 'var(--accent)' : 'var(--ink-muted)',
        marginBottom: 14,
      }}>
        {icon}
      </div>
      <div className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: 6 }}>
        {label}
      </p>
    </Card>
  );
}

export * from './LogoImg';
