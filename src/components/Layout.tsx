// FILE: src/components/Layout.tsx
import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, BookOpen, BarChart3, Menu, X, Zap } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { COPY } from '../theme/brand';
import { useUser } from '../context/UserContext';
import SkillsEditor from './SkillsEditor';
import Footer from './Footer';
import BrandLogo from './BrandLogo';

export default function Layout() {
  const loc = useLocation();
  const { mode, toggle } = useTheme();
  const { currentUser, logout, skillsEditorOpen, openSkillsEditor, closeSkillsEditor, todayCount, streak } = useUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobileNav = viewport.width < 768;
  const is3xl = viewport.width >= 1536;
  const isShortLandscape = viewport.width > viewport.height && viewport.height < 500;
  const navHeight = isShortLandscape && isMobileNav ? 44 : isMobileNav ? 52 : 60;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [loc.pathname]);

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
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        fontSize: '0.78rem',
        fontWeight: active(path) ? 700 : 500,
        color: active(path) ? 'var(--primary)' : 'var(--text-secondary)',
        textDecoration: 'none',
        padding: '6px 14px',
        borderRadius: 999,
        position: 'relative',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: active(path) ? 'var(--primary-soft)' : 'transparent',
        border: active(path) ? '1px dashed var(--primary)' : '1px dashed transparent',
      }}
      onMouseEnter={e => {
        if (!active(path)) {
          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          (e.currentTarget as HTMLElement).style.border = '1px dashed var(--border)';
        }
      }}
      onMouseLeave={e => {
        if (!active(path)) {
          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          (e.currentTarget as HTMLElement).style.border = '1px dashed transparent';
        }
      }}
    >
      {icon && <span style={{ color: active(path) ? 'var(--primary)' : 'var(--muted-ink)' }}>{icon}</span>}
      <span>
        <span style={{ opacity: 0.5 }}>~/</span>
        {label.toLowerCase().replace(/\s+/g, '_')}
      </span>
    </Link>
  );

  /* ── Mobile-only nav link (bigger touch target, full width) ── */
  const mobileNavLink = (path: string, label: string, icon: ReactNode) => (
    <Link
      to={path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        textDecoration: 'none',
        fontSize: '0.88rem',
        fontWeight: active(path) ? 700 : 500,
        color: active(path) ? 'var(--primary)' : 'var(--ink)',
        background: active(path) ? 'var(--primary-soft)' : 'transparent',
        border: active(path) ? '1px dashed var(--primary)' : '1px dashed transparent',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ color: active(path) ? 'var(--primary)' : 'var(--muted-ink)', display: 'flex' }}>{icon}</span>
      {label}
    </Link>
  );

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Masks text scrolling into the transparent gap above the floating dock */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 20, background: 'var(--paper)', zIndex: 49 }} />

      <div style={{ position: 'sticky', top: 16, zIndex: 50, padding: isMobileNav ? '0 10px' : '0 24px', marginBottom: 24 }}>
        <nav
          className="nav-blur"
          style={{
            maxWidth: is3xl ? 1600 : 1200,
            margin: '0 auto',
            height: navHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobileNav ? '0 10px' : '0 20px',
            background: mode === 'dark' ? 'rgba(18, 18, 18, 0.6)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1.25px dashed var(--border)',
            borderRadius: 999,
            boxShadow: mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
            (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${mode === 'dark' ? 'rgba(45, 106, 79, 0.4)' : 'rgba(45, 106, 79, 0.15)'}`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            (e.currentTarget as HTMLElement).style.boxShadow = mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.06)';
          }}
        >
          {/* ── Logo ── */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <BrandLogo size={isMobileNav ? 'sm' : 'md'} compact={isMobileNav} />
          </Link>

          {/* ── Desktop nav links ── */}
          {!isMobileNav && (
            <div
              className="nav-links"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: is3xl ? 12 : 8,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {navLink('/directory', COPY.nav.companies)}
              {navLink('/jobs', COPY.nav.browseJobs)}
              {navLink('/progress', COPY.nav.myProgress, <BarChart3 size={14} />)}
            </div>
          )}

          {/* ── Right side actions ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobileNav ? 6 : 10 }}>
            {/* Desktop-only: progress badge */}
            {!isMobileNav && currentUser && (
              <Link
                to="/progress"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface-solid)', color: 'var(--text-primary)' }}
                title="View progress"
              >
                {streak > 0 && <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--warning)' }}>🔥{streak}</span>}
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: todayCount > 0 ? 'var(--primary)' : 'var(--paper2)', color: todayCount > 0 ? '#fff' : 'var(--muted-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 700 }}>{todayCount}</span>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--muted-ink)' }}>applied today</span>
              </Link>
            )}

            {/* Desktop-only: theme toggle */}
            {!isMobileNav && (
              <button
                onClick={toggle}
                style={{
                  borderRadius: 8,
                  border: '1px solid var(--border-mid)',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.18s',
                  minWidth: 44,
                  minHeight: 44,
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
            )}

            {/* Desktop-only: user avatar + dropdown */}
            {!isMobileNav && currentUser && (
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
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  }}
                  title={currentUser.name}
                >
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', background: '#eee' }}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: 'var(--primary)', display: 'none' }}>{currentUser.name.charAt(0).toUpperCase()}</span>
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
                        logout();
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
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Mobile-only: compact profile pic ── */}
            {isMobileNav && currentUser && (
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1.5px solid var(--primary)',
                overflow: 'hidden', flexShrink: 0,
              }}>
                <img
                  src={currentUser.picture}
                  alt={currentUser.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* ── Mobile hamburger button ── */}
            {isMobileNav && (
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label="Toggle navigation menu"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: mobileMenuOpen ? '1.5px solid var(--primary)' : '1px solid var(--border-mid)',
                  background: mobileMenuOpen ? 'var(--primary-soft)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: mobileMenuOpen ? 'var(--primary)' : 'var(--text-secondary)',
                  transition: 'all 0.18s',
                  flexShrink: 0,
                }}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>
        </nav>

        {/* ── Mobile menu flyout ── */}
        {mobileMenuOpen && isMobileNav && (
          <div className="mobile-menu" style={{
            marginTop: 8,
            background: mode === 'dark' ? 'rgba(18, 18, 18, 0.97)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 16,
            border: '1.25px dashed var(--border)',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            boxShadow: mode === 'dark' ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.1)',
          }}>
            {mobileNavLink('/jobs', COPY.nav.browseJobs, <Zap size={16} />)}
            {mobileNavLink('/directory', COPY.nav.companies, <BookOpen size={16} />)}
            {mobileNavLink('/progress', COPY.nav.myProgress, <BarChart3 size={16} />)}

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

            {/* Progress info + theme toggle row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {currentUser && (
                  <>
                    {streak > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)' }}>🔥 {streak}</span>}
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-ink)' }}>{todayCount} applied today</span>
                  </>
                )}
              </div>
              <button
                onClick={toggle}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: '1px solid var(--border-mid)',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                {mode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>

            {/* User actions */}
            {currentUser && (
              <>
                <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', gap: 8, padding: '6px 4px' }}>
                  <button
                    onClick={() => { setMobileMenuOpen(false); openSkillsEditor(); }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 0', borderRadius: 8, border: '1px solid var(--border)',
                      background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer',
                      fontSize: '0.8rem', fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >
                    <BookOpen size={13} /> My Skills
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px 0', borderRadius: 8, border: '1px solid var(--border)',
                      background: 'var(--paper2)', color: 'var(--muted-ink)', cursor: 'pointer',
                      fontSize: '0.8rem', fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      <Footer />
      {skillsEditorOpen && <SkillsEditor onClose={closeSkillsEditor} />}
    </div>
  );
}