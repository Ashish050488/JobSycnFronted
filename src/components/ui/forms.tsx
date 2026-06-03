// FILE: src/components/ui/forms.tsx
import {
  forwardRef, type ReactNode, type CSSProperties,
  type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes,
} from 'react';

const INPUT_STYLE: CSSProperties = {
  width: '100%', padding: '10px 12px',
  fontFamily: 'inherit', fontSize: '0.9375rem',
  background: 'var(--surface)', color: 'var(--ink)',
  border: '1px solid var(--border-strong)', borderRadius: 10,
  outline: 'none', transition: 'border-color 180ms ease, box-shadow 180ms ease',
};

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, className = '', ...rest }, ref) => (
    <div style={{ width: '100%' }}>
      <input ref={ref} className={className}
        style={{ ...INPUT_STYLE, ...(error ? { borderColor: 'var(--danger)' } : {}), ...style }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--danger)' : 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
        {...rest} />
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
    </div>
  )
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, className = '', ...rest }, ref) => (
    <div style={{ width: '100%' }}>
      <textarea ref={ref} className={className}
        style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 100, ...style }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
        {...rest} />
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
    </div>
  )
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { error?: string }>(
  ({ error, style, onFocus, onBlur, children, className = '', ...rest }, ref) => (
    <div style={{ width: '100%', position: 'relative' }}>
      <select ref={ref} className={className}
        style={{
          ...INPUT_STYLE, appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%236F6E69' stroke-width='2'%3E%3Cpath d='M3 5l4 4 4-4'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
          paddingRight: 32, cursor: 'pointer', ...style,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--focus-ring)'; onFocus?.(e); }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'none'; onBlur?.(e); }}
        {...rest}>{children}</select>
      {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 5, fontWeight: 500 }}>{error}</p>}
    </div>
  )
);

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: 6, fontSize: '0.78rem', fontWeight: 500, color: 'var(--ink-muted)' }}>{children}</label>;
}

export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p style={{ color: 'var(--ink-faint)', fontSize: '0.75rem', marginTop: 5 }}>{hint}</p>}
    </div>
  );
}
