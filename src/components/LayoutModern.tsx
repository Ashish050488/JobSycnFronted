// FILE: src/components/LayoutModern.tsx
import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Sun, Moon, LogOut, BookOpen, BarChart3, Menu, X,
  Briefcase, Building2, Flame, Home as HomeIcon,
} from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { useUser } from '../context/UserContext';
import SkillsEditor from './SkillsEditor';
import Footer from './Footer';
import BrandLogo from './BrandLogo';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  authOnly?: boolean;
  guestOnly?: boolean;
}

function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));
  useEffect(() => {
    const fn = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return vp;
}

export default function LayoutModern() {
  const loc = useLocation();
  const { mode, toggle } = useTheme();
  const {
    currentUser, logout, skillsEditorOpen, openSkillsEditor, closeSkillsEditor,
    todayCount, streak,
  } = useUser();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const vp = useViewport();
  const isMobile = vp.w < 768;
  const isCompact = vp.w < 1024;

  useEffect(() => { setMobileMenuOpen(false); setUserMenuOpen(false); }, [loc.pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const active = (path: string) => {
    if (path === '/') return loc.pathname === '/';
    return loc.pathname === path || loc.pathname.startsWith(path + '/');
  };

  // Nav items shown in both top + bottom navs
  const navItems: NavItem[] = currentUser ? [
    { to: '/', label: 'Today', icon: <HomeIcon size={18} /> },
    { to: '/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
    { to: '/hiring', label: 'Hiring', icon: <Flame size={18} /> },
    { to: '/directory', label: 'Companies', icon: <Building2 size={18} /> },
    { to: '/progress', label: 'Progress', icon: <BarChart3 size={18} /> },
  ] : [
    { to: '/', label: 'Home', icon: <HomeIcon size={18} /> },
    { to: '/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
    { to: '/hiring', label: 'Hiring', icon: <Flame size={18} /> },
    { to: '/directory', label: 'Companies', icon: <Building2 size={18} /> },
  ];

  /* ──────────────────────────────────────────────────────────── */
  /* Reusable styles                                              */
  /* ──────────────────────────────────────────────────────────── */
  const utilityBtn: CSSProperties = {
    width: 38, height: 38, borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--ink-muted)',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
    flexShrink: 0,
  };

  const topNavLink = (item: NavItem) => (
    <Link
      key={item.to}
      to={item.to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '7px 12px',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: active(item.to) ? 600 : 500,
        color: active(item.to) ? 'var(--ink)' : 'var(--ink-muted)',
        background: active(item.to) ? 'var(--paper-2)' : 'transparent',
        transition: 'all 160ms ease',
      }}
      onMouseEnter={e => { if (!active(item.to)) (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)'; }}
      onMouseLeave={e => { if (!active(item.to)) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <span style={{ color: active(item.to) ? 'var(--accent)' : 'var(--ink-faint)', display: 'flex' }}>{item.icon}</span>
      <span style={{ display: isCompact ? 'none' : 'inline' }}>{item.label}</span>
    </Link>
  );

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--paper)',
    }}>
      {/* ── TOP NAV ──────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--glass-bg)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: isMobile ? '10px 16px' : '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          minHeight: isMobile ? 56 : 60,
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <BrandLogo size={isMobile ? 'sm' : 'md'} />
          </Link>

          {/* Desktop nav */}
          {!isMobile && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 16 }}>
              {navItems.map(topNavLink)}
            </nav>
          )}

          <div style={{ flex: 1 }} />

          {/* Quick stat (logged in) — desktop only */}
          {!isMobile && currentUser && (
            <Link
              to="/progress"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                background: 'var(--paper-2)',
                border: '1px solid var(--border)',
              }}
              title="View progress"
            >
              <span style={{
                width: 22, height: 22, borderRadius: 6,
                background: todayCount > 0 ? 'var(--accent)' : 'var(--paper-3)',
                color: todayCount > 0 ? '#fff' : 'var(--ink-muted)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.72rem', fontWeight: 700,
              }}>{todayCount}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>today</span>
              {streak > 0 && (
                <>
                  <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 600 }}>
                    {streak}d streak
                  </span>
                </>
              )}
            </Link>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={utilityBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--paper-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--ink-muted)'; }}
          >
            {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User menu OR Sign in */}
          {currentUser ? (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--paper-2)',
                  cursor: 'pointer', padding: 0,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
                title={currentUser.name}
              >
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </button>

              {userMenuOpen && (
                <div
                  className="anim-scale"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    minWidth: 220,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: 'var(--shadow-lg)',
                    padding: 6,
                    zIndex: 100,
                  }}
                >
                  <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</div>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); openSkillsEditor(); }}
                    style={menuItem}
                  >
                    <BookOpen size={14} /> My skills
                  </button>
                  <Link to="/progress" onClick={() => setUserMenuOpen(false)} style={{ ...menuItem, textDecoration: 'none' }}>
                    <BarChart3 size={14} /> My progress
                  </Link>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                  <button onClick={() => { setUserMenuOpen(false); logout(); }} style={menuItem}>
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: '0.875rem',
                fontWeight: 500,
                background: 'var(--ink)',
                color: 'var(--paper)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Sign in
            </Link>
          )}

          {/* Mobile menu button (kept as extra entry point, but bottom bar is primary nav) */}
          {isMobile && currentUser && (
            <button
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Open menu"
              style={utilityBtn}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>

        {/* Mobile dropdown — quick stat + extras */}
        {isMobile && mobileMenuOpen && currentUser && (
          <div
            className="anim-fade"
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--paper-2)',
              border: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>{currentUser.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                  {todayCount} applied today{streak > 0 ? ` · ${streak}d streak` : ''}
                </div>
              </div>
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <button onClick={() => { setMobileMenuOpen(false); openSkillsEditor(); }} style={mobileMenuButton}>
              <BookOpen size={15} /> My skills
            </button>
            <button onClick={() => { setMobileMenuOpen(false); logout(); }} style={mobileMenuButton}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </header>

      {/* ── MAIN ──────────────────────────────────────────────── */}
      <main
        className={isMobile ? 'has-bottom-nav' : ''}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Outlet />
      </main>

      {/* ── FOOTER (desktop only — mobile uses bottom nav) ─────── */}
      {!isMobile && <Footer />}

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────── */}
      {isMobile && (
        <nav
          aria-label="Primary"
          style={{
            position: 'fixed',
            left: 0, right: 0, bottom: 0,
            zIndex: 50,
            paddingBottom: 'env(safe-area-inset-bottom)',
            background: 'var(--glass-bg)',
            backdropFilter: 'saturate(180%) blur(24px)',
            WebkitBackdropFilter: 'saturate(180%) blur(24px)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
            maxWidth: 600,
            margin: '0 auto',
          }}>
            {navItems.map(item => {
              const isActive = active(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    padding: '10px 4px 12px',
                    textDecoration: 'none',
                    color: isActive ? 'var(--accent)' : 'var(--ink-muted)',
                    fontSize: '0.62rem',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'color 160ms ease',
                    minWidth: 0,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {skillsEditorOpen && <SkillsEditor onClose={closeSkillsEditor} />}
    </div>
  );
}

const menuItem: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '8px 12px',
  fontSize: '0.875rem',
  color: 'var(--ink-2)',
  background: 'none',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
};

const mobileMenuButton: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '11px 14px',
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--ink-2)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '0.875rem',
  fontWeight: 500,
  textAlign: 'left' as const,
};

// suppress unused import warning
