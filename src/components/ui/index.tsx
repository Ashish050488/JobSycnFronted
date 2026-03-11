// ─── Design System UI Primitives ─────────────────────────────────────────────
// Paper + Ink sketch aesthetic. All components read from CSS variables only.

import { type ReactNode, type CSSProperties, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, forwardRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Size = 'sm' | 'md' | 'lg';
type Variant = 'primary' | 'ghost' | 'danger' | 'success' | 'outline';
// UPDATED: Added 'acid' to the union type
type BadgeVariant = 'primary' | 'green' | 'red' | 'yellow' | 'blue' | 'neutral' | 'acid';

// ── Container ─────────────────────────────────────────────────────────────────
export function Container({ children, size = 'xl', style, className = '' }: {
  children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; style?: CSSProperties; className?: string;
}) {
  const maxW = { sm: '640px', md: '768px', lg: '1024px', xl: '1200px' }[size];
  return <div style={{ maxWidth: maxW, margin: '0 auto', padding: '0 24px', ...style }} className={className}>{children}</div>;
}

// ── Stack ─────────────────────────────────────────────────────────────────────
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

// ── Button ────────────────────────────────────────────────────────────────────
const BTN_BASE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  fontFamily: 'inherit', fontWeight: 600, letterSpacing: '0.01em',
  border: 'none', borderRadius: '10px',
  cursor: 'pointer', textDecoration: 'none', lineHeight: 1,
  transition: 'all 0.22s cubic-bezier(0.2,0.8,0.2,1)',
  whiteSpace: 'nowrap',
};
const BTN_SIZE: Record<Size, CSSProperties> = {
  sm: { fontSize: '0.8rem', padding: '8px 16px' },
  md: { fontSize: '0.875rem', padding: '11px 22px' },
  lg: { fontSize: '0.95rem', padding: '14px 28px' },
};
const BTN_VARIANT: Record<Variant, CSSProperties> = {
  primary: { background: 'var(--primary)', color: '#ffffff' },
  ghost: { background: 'transparent', color: 'var(--ink2)', border: '1.25px solid var(--ink-border-strong, var(--border-strong))' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger)', border: '1.25px solid var(--danger)' },
  success: { background: 'var(--success-soft)', color: 'var(--success)', border: '1.25px solid var(--success)' },
  outline: { background: 'transparent', color: 'var(--ink)', border: '1.25px solid var(--ink-border-strong, var(--border-strong))' },
};


interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant; size?: Size; loading?: boolean; as?: 'button' | 'a'; href?: string; children: ReactNode;
}
export function Button({ variant = 'primary', size = 'md', loading, children, style, as: Tag = 'button', href, className = '', ...rest }: ButtonProps & { className?: string }) {
  const sketchClass = (variant === 'ghost' || variant === 'outline') ? 'sketch-ink marker-hover' : '';
  const merged: CSSProperties = { ...BTN_BASE, ...BTN_SIZE[size], ...BTN_VARIANT[variant], ...(loading ? { opacity: 0.65, cursor: 'not-allowed' } : {}), ...style };
  if (Tag === 'a') return <a href={href} className={`${sketchClass} ${className}`} style={merged} {...(rest as any)}>{loading ? <Spinner size={14} /> : children}</a>;
  return <button disabled={loading || rest.disabled} className={`${sketchClass} ${className}`} style={merged} {...rest}>{loading ? <Spinner size={14} /> : children}</button>;
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
const INPUT_STYLE: CSSProperties = {
  width: '100%', padding: '12px 14px',
  fontFamily: 'inherit', fontSize: '0.925rem',
  background: 'var(--surface-solid)',
  color: 'var(--ink)',
  border: '1.25px solid var(--ink-border, var(--border))',
  borderRadius: '10px', outline: 'none',
  transition: 'border-color 0.22s, box-shadow 0.22s',
};

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, className = '', ...rest }, ref) => {
    return (
      <div style={{ width: '100%' }}>
        <input
          ref={ref}
          className={`sketch-ink ${className}`}
          style={{ ...INPUT_STYLE, ...(error ? { borderColor: 'var(--danger)' } : {}), ...style }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--ink-border, var(--border))'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
          {...rest}
        />
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
      </div>
    );
  }
);

// ── Textarea ──────────────────────────────────────────────────────────────────
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, className = '', ...rest }, ref) => (
    <div style={{ width: '100%' }}>
      <textarea
        ref={ref}
        className={`sketch-ink ${className}`}
        style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 100, ...style }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--ink-border, var(--border))'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
        {...rest}
      />
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
    </div>
  )
);

// ── Select ────────────────────────────────────────────────────────────────────
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, children, className = '', ...rest }, ref) => (
    <div style={{ width: '100%', position: 'relative' }}>
      <select
        ref={ref}
        className={`sketch-ink ${className}`}
        style={{
          ...INPUT_STYLE,
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236F6F6F' stroke-width='2'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: 36,
          cursor: 'pointer',
          ...style
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--ink-border, var(--border))'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
        {...rest}
      >
        {children}
      </select>
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
    </div>
  )
);

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style, onClick, hoverable, className = '' }: { children: ReactNode; style?: CSSProperties; onClick?: () => void; hoverable?: boolean; className?: string }) {
  return (
    <div
      onClick={onClick}
      className={`sketch-ink sketch-surface ${hoverable ? 'marker-hover' : ''} ${className}`}
      style={{
        background: 'var(--surface-solid)',
        border: '1.25px solid var(--ink-border, var(--border))',
        borderRadius: 14, padding: '20px 24px',
        transition: 'border-color 0.22s, box-shadow 0.22s, transform 0.22s',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={hoverable ? e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ink-border-strong, var(--border-strong))'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'; } : undefined}
      onMouseLeave={hoverable ? e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ink-border, var(--border))'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--highlight-edge, none)'; } : undefined}
    >
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_STYLE: Record<BadgeVariant, CSSProperties> = {
  primary: { background: 'var(--primary-soft)', color: 'var(--primary)', border: '1.25px solid var(--primary)' },
  green: { background: 'var(--success-soft)', color: 'var(--success)', border: '1.25px solid var(--success)' },
  red: { background: 'var(--danger-soft)', color: 'var(--danger)', border: '1.25px solid var(--danger)' },
  yellow: { background: 'var(--warning-soft)', color: 'var(--warning)', border: '1.25px solid var(--warning)' },
  blue: { background: 'var(--info-soft)', color: 'var(--info)', border: '1.25px solid var(--info)' },
  neutral: { background: 'var(--paper2)', color: 'var(--muted-ink)', border: '1.25px solid var(--border)' },
  // UPDATED: Added style mapping for 'acid'
  acid: { background: 'var(--acid-soft)', color: 'var(--acid)', border: '1.25px solid var(--acid)' },
};

export function Badge({ children, variant = 'neutral', style }: { children: ReactNode; variant?: BadgeVariant; style?: CSSProperties }) {
  return (
    <span className="sketch-ink" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 6,
      fontFamily: "'Caveat', ui-sans-serif",
      fontSize: '0.82rem', fontWeight: 600,
      whiteSpace: 'nowrap',
      ...BADGE_STYLE[variant], ...style,
    }}>
      {children}
    </span>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────
export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: 'block', marginBottom: 7,
      fontSize: '0.8rem', fontWeight: 600,
      color: 'var(--muted-ink)',
    }}>
      {children}
    </label>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: CSSProperties }) {
  return <hr style={{ border: 'none', borderTop: '1.25px solid var(--ink-border, var(--border))', ...style }} />;
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ label, title, subtitle, actions }: {
  label?: string; title: ReactNode; subtitle?: string; actions?: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      {label && <p className="font-sketch" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>{label}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>{title}</h1>
          {subtitle && <p style={{ color: 'var(--muted-ink)', marginTop: 6, fontSize: '0.9rem', lineHeight: 1.5 }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────────────────────
export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p style={{ color: 'var(--subtle-ink)', fontSize: '0.75rem', marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="sketch-ink" style={{
      textAlign: 'center', padding: '64px 24px',
      background: 'var(--surface-solid)', border: '1.25px dashed var(--ink-border-strong, var(--border-strong))',
      borderRadius: 14,
    }}>
      {icon && <div style={{ color: 'var(--subtle-ink)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>{icon}</div>}
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{title}</h3>
      {body && <p style={{ color: 'var(--muted-ink)', fontSize: '0.88rem', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.5 }}>{body}</p>}
      {action}
    </div>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'info', children }: { type?: 'success' | 'error' | 'warning' | 'info'; children: ReactNode }) {
  const colorMap = {
    success: { bg: 'var(--success-soft)', fg: 'var(--success)', border: 'var(--success)' },
    error: { bg: 'var(--danger-soft)', fg: 'var(--danger)', border: 'var(--danger)' },
    warning: { bg: 'var(--warning-soft)', fg: 'var(--warning)', border: 'var(--warning)' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info)', border: 'var(--info)' },
  };
  const c = colorMap[type];
  return (
    <div className="sketch-ink" style={{
      padding: '12px 16px', borderRadius: 10, fontSize: '0.875rem', fontWeight: 500,
      background: c.bg, color: c.fg, border: `1.25px solid ${c.border}`,
    }}>
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ icon, value, label, accent }: { icon: ReactNode; value: ReactNode; label: string; accent?: boolean }) {
  return (
    <Card style={{ textAlign: 'center', ...(accent ? { border: '1.25px solid var(--primary)' } : {}) }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: accent ? 'var(--primary-soft)' : 'var(--paper2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent ? 'var(--primary)' : 'var(--muted-ink)',
        margin: '0 auto 14px',
        border: accent ? '1.25px solid var(--primary)' : '1.25px solid var(--ink-border, var(--border))',
      }}>
        {icon}
      </div>
      <div className="font-sketch-num" style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>
        {value}
      </div>
      <p className="font-sketch" style={{ fontSize: '0.95rem', color: 'var(--muted-ink)', marginTop: 8 }}>
        {label}
      </p>
    </Card>
  );
}