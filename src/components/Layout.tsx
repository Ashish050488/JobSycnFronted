// FILE: src/components/Layout.tsx
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Zap } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { BRAND, COPY } from '../theme/brand';
import Footer from './Footer';

export default function Layout() {
  const loc = useLocation();
  const { mode, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  const active = (path: string) => loc.pathname === path;
  const navLink = (path: string, label: string) => (
    <Link
      to={path}
      onClick={() => setOpen(false)}
      style={{
        fontSize: '0.82rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: active(path) ? 'var(--text-primary)' : 'var(--text-secondary)',
        textDecoration: 'none',
        padding: '5px 0',
        position: 'relative',
        transition: 'color 0.18s',
      }}
      onMouseEnter={e => !active(path) && ((e.target as HTMLElement).style.color = 'var(--text-primary)')}
      onMouseLeave={e => !active(path) && ((e.target as HTMLElement).style.color = 'var(--text-secondary)')}
    >
      {label}
      {active(path) && (
        <span
          style={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: 2,
            background: 'var(--acid)',
            borderRadius: 2,
          }}
        />
      )}
    </Link>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav
        className="nav-blur"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 24px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: 'var(--acid-dim)',
                border: '1px solid var(--acid-mid)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={14} color="var(--acid)" />
            </div>
            <span
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {BRAND.appName.replace('Jobs', '')}
              <span style={{ color: 'var(--acid)' }}>Jobs</span>
            </span>
          </Link>

          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 28 }}>
            {navLink('/directory', COPY.nav.companies)}
            {navLink('/jobs', COPY.nav.browseJobs)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={toggle}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border-mid)',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--acid)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--acid)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-mid)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              title={mode === 'dark' ? COPY.nav.switchToLight : COPY.nav.switchToDark}
            >
              {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              className="md:hidden"
              onClick={() => setOpen(!open)}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: 6,
                cursor: 'pointer',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {open ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {open && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {navLink('/directory', COPY.nav.companies)}
            {navLink('/jobs', COPY.nav.browseJobs)}
          </div>
        )}
      </nav>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
