// FILE: src/components/Layout.tsx
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Zap, LogOut, BookOpen, BarChart3 } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { BRAND, COPY } from '../theme/brand';
import { useUser } from '../context/UserContext';
import SkillsEditor from './SkillsEditor';
import Footer from './Footer';

export default function Layout() {
  const loc = useLocation();
  const { mode, toggle } = useTheme();
  const { currentUser, switchUser, skillsEditorOpen, openSkillsEditor, closeSkillsEditor, todayCount, streak } = useUser();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const active = (path: string) => loc.pathname === path;
  const navLink = (path: string, label: string, icon?: ReactNode) => (
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
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {icon}
        {label}
      </span>
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
            {navLink('/progress', COPY.nav.myProgress, <BarChart3 size={14} />)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentUser && (
              <>
                <Link
                  to="/progress"
                  className="hidden md:flex"
                  style={{ textDecoration: 'none', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text-primary)' }}
                  title="View progress"
                >
                  {streak > 0 && <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--warning)' }}>🔥{streak}</span>}
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: todayCount > 0 ? 'var(--primary)' : 'var(--paper2)', color: todayCount > 0 ? '#fff' : 'var(--muted-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 700 }}>{todayCount}</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--muted-ink)' }}>applied today</span>
                </Link>
                <Link
                  to="/progress"
                  className="md:hidden"
                  style={{ textDecoration: 'none', width: 30, height: 30, borderRadius: '50%', background: todayCount > 0 ? 'var(--primary)' : 'var(--paper2)', color: todayCount > 0 ? '#fff' : 'var(--muted-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 700, border: '1px solid var(--border)' }}
                  title="View progress"
                >
                  {todayCount}
                </Link>
              </>
            )}

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

            {/* ─── User pill ─── */}
            {currentUser && (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    transition: 'border-color 0.18s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  }}
                  title={currentUser.name}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      minWidth: 160,
                      background: 'var(--surface-solid)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      boxShadow: 'var(--shadow-md)',
                      padding: '6px 0',
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      {currentUser.name}
                    </div>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        openSkillsEditor();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        fontSize: '0.8rem',
                        color: 'var(--muted-ink)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-soft)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'none';
                      }}
                    >
                      <BookOpen size={13} />
                      My Skills
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        switchUser();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        fontSize: '0.8rem',
                        color: 'var(--muted-ink)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-soft)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'none';
                      }}
                    >
                      <LogOut size={13} />
                      Switch User
                    </button>
                  </div>
                )}
              </div>
            )}

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
            {navLink('/progress', COPY.nav.myProgress, <BarChart3 size={14} />)}
          </div>
        )}
      </nav>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      {skillsEditorOpen && <SkillsEditor onClose={closeSkillsEditor} />}
    </div>
  );
}
