import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, BookOpen, BarChart3, Menu, X, Zap, Building2 } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { COPY } from '../theme/brand';
import { useUser } from '../context/UserContext';
import SkillsEditor from './SkillsEditor';
import Footer from './Footer';
import BrandLogo from './BrandLogo';

export default function LayoutModern() {
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

  const isMobileNav = viewport.width < 768;
  const isNarrowMobile = viewport.width < 420;
  const is3xl = viewport.width >= 1536;
  const isShortLandscape = viewport.width > viewport.height && viewport.height < 500;
  const navHeight = isShortLandscape && isMobileNav ? 50 : isMobileNav ? 58 : 68;
  const active = (path: string) => loc.pathname === path;

  const utilityButtonStyle: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 14,
    border: '1px solid color-mix(in srgb, var(--border) 88%, transparent)',
    background: 'color-mix(in srgb, var(--surface-solid) 88%, transparent)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    transition: 'all 0.18s ease',
    flexShrink: 0,
  };

  const navLink = (path: string, label: string, icon?: ReactNode) => (
    <Link
      to={path}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 16,
        textDecoration: 'none',
        fontSize: '0.83rem',
        fontWeight: active(path) ? 700 : 600,
        letterSpacing: '0.01em',
        color: active(path) ? 'var(--text-primary)' : 'var(--muted-ink)',
        background: active(path) ? 'linear-gradient(135deg, var(--primary-soft), color-mix(in srgb, var(--surface-solid) 72%, transparent))' : 'transparent',
        border: active(path) ? '1px solid color-mix(in srgb, var(--primary) 55%, var(--border))' : '1px solid transparent',
        boxShadow: active(path) ? '0 10px 24px rgba(45, 106, 79, 0.14)' : 'none',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active(path)) {
          (e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--paper2) 70%, transparent)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        }
      }}
      onMouseLeave={e => {
        if (!active(path)) {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.color = 'var(--muted-ink)';
          (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
        }
      }}
    >
      {icon && <span style={{ color: active(path) ? 'var(--primary)' : 'var(--subtle-ink)', display: 'flex' }}>{icon}</span>}
      {label}
    </Link>
  );

  const mobileNavLink = (path: string, label: string, icon: ReactNode, caption: string) => (
    <Link
      to={path}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 16,
        textDecoration: 'none',
        color: active(path) ? 'var(--text-primary)' : 'var(--ink)',
        background: active(path) ? 'linear-gradient(135deg, var(--primary-soft), color-mix(in srgb, var(--surface-solid) 76%, transparent))' : 'var(--paper2)',
        border: active(path) ? '1px solid color-mix(in srgb, var(--primary) 60%, var(--border))' : '1px solid var(--border)',
        transition: 'all 0.18s ease',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active(path) ? 'var(--primary)' : 'var(--muted-ink)',
          background: active(path) ? 'rgba(255,255,255,0.7)' : 'var(--surface-solid)',
          border: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.2 }}>{label}</span>
        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-ink)', marginTop: 2 }}>{caption}</span>
      </span>
      <span style={{ fontSize: '0.95rem', color: active(path) ? 'var(--primary)' : 'var(--subtle-ink)' }}>/</span>
    </Link>
  );

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 20, background: 'var(--paper)', zIndex: 49 }} />

      <div
        style={{
          position: 'sticky',
          top: isMobileNav ? 10 : 16,
          zIndex: 50,
          padding: isMobileNav ? '0 10px' : '0 24px',
          marginBottom: isMobileNav ? 18 : 26,
        }}
      >
        <nav
          className="nav-blur"
          style={{
            maxWidth: is3xl ? 1600 : 1240,
            margin: '0 auto',
            minHeight: navHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: isMobileNav ? 10 : 18,
            padding: isMobileNav ? '8px 10px 8px 14px' : '10px 16px 10px 18px',
            background: mode === 'dark'
              ? 'linear-gradient(135deg, rgba(16, 18, 21, 0.94), rgba(20, 27, 24, 0.82))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(241, 249, 245, 0.84))',
            border: '1px solid color-mix(in srgb, var(--border) 80%, transparent)',
            borderRadius: isMobileNav ? 24 : 28,
            boxShadow: mode === 'dark'
              ? '0 16px 40px rgba(0, 0, 0, 0.34)'
              : '0 18px 40px rgba(16, 24, 40, 0.08)',
            overflow: 'visible',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobileNav ? 10 : 14, minWidth: 0, flex: isMobileNav ? '1 1 auto' : '0 1 auto' }}>
            <Link to="/" style={{ textDecoration: 'none', minWidth: 0 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', minWidth: 0 }}>
                <BrandLogo size={isMobileNav ? 'sm' : 'md'} compact={false} />
              </span>
            </Link>
            {!isMobileNav && (
              <div
                style={{
                  paddingLeft: 14,
                  borderLeft: '1px solid color-mix(in srgb, var(--border) 82%, transparent)',
                  fontSize: '0.72rem',
                  color: 'var(--subtle-ink)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                Direct apply only
              </div>
            )}
          </div>

          {!isMobileNav && (
            <div
              className="nav-links"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px',
                borderRadius: 22,
                background: 'color-mix(in srgb, var(--paper2) 72%, transparent)',
                border: '1px solid color-mix(in srgb, var(--border) 74%, transparent)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {navLink('/jobs', COPY.nav.browseJobs, <Zap size={15} />)}
              {navLink('/directory', COPY.nav.companies, <Building2 size={15} />)}
              {navLink('/progress', COPY.nav.myProgress, <BarChart3 size={15} />)}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobileNav ? 8 : 10, flexShrink: 0 }}>
            {!isMobileNav && currentUser && (
              <Link
                to="/progress"
                style={{
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 12px',
                  borderRadius: 18,
                  border: '1px solid color-mix(in srgb, var(--border) 88%, transparent)',
                  background: 'color-mix(in srgb, var(--surface-solid) 88%, transparent)',
                  color: 'var(--text-primary)',
                }}
                title="View progress"
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: todayCount > 0 ? 'var(--primary)' : 'var(--paper2)',
                    color: todayCount > 0 ? '#fff' : 'var(--muted-ink)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {todayCount}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {streak > 0 && <span style={{ fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 700 }}>#{streak}</span>}
                  <span style={{ fontSize: '0.76rem', color: 'var(--muted-ink)', whiteSpace: 'nowrap' }}>applied today</span>
                </span>
              </Link>
            )}

            {isMobileNav && currentUser && !isNarrowMobile && (
              <Link
                to="/progress"
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 12px',
                  minHeight: 42,
                  borderRadius: 16,
                  border: '1px solid color-mix(in srgb, var(--border) 88%, transparent)',
                  background: 'color-mix(in srgb, var(--surface-solid) 90%, transparent)',
                  color: 'var(--text-primary)',
                }}
                title="View progress"
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: todayCount > 0 ? 'var(--primary)' : 'var(--paper2)',
                    color: todayCount > 0 ? '#fff' : 'var(--muted-ink)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {todayCount}
                </span>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--muted-ink)', whiteSpace: 'nowrap' }}>
                  {streak > 0 ? `#${streak} streak` : 'today'}
                </span>
              </Link>
            )}

            {!isMobileNav && (
              <button
                onClick={toggle}
                style={utilityButtonStyle}
                title={mode === 'dark' ? COPY.nav.switchToLight : COPY.nav.switchToDark}
              >
                {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}

            {!isMobileNav && currentUser && (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    border: '1px solid color-mix(in srgb, var(--border) 88%, transparent)',
                    background: 'color-mix(in srgb, var(--primary-soft) 92%, transparent)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 10px 22px rgba(45, 106, 79, 0.12)',
                  }}
                  title={currentUser.name}
                >
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#eee' }}
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 10px)',
                      right: 0,
                      minWidth: 190,
                      background: 'var(--surface-solid)',
                      border: '1px solid var(--border)',
                      borderRadius: 16,
                      boxShadow: 'var(--shadow-md)',
                      padding: 8,
                      zIndex: 100,
                    }}
                  >
                    <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ink)' }}>{currentUser.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--muted-ink)', marginTop: 2 }}>Keep your job hunt organized</div>
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
                        padding: '10px 12px',
                        fontSize: '0.82rem',
                        color: 'var(--muted-ink)',
                        background: 'none',
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                      }}
                    >
                      <BookOpen size={14} />
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
                        padding: '10px 12px',
                        fontSize: '0.82rem',
                        color: 'var(--muted-ink)',
                        background: 'none',
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                      }}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {isMobileNav && (
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label="Toggle navigation menu"
                style={{
                  ...utilityButtonStyle,
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  border: mobileMenuOpen ? '1px solid color-mix(in srgb, var(--primary) 70%, var(--border))' : utilityButtonStyle.border,
                  background: mobileMenuOpen
                    ? 'linear-gradient(135deg, var(--primary-soft), color-mix(in srgb, var(--surface-solid) 80%, transparent))'
                    : utilityButtonStyle.background,
                  color: mobileMenuOpen ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
              </button>
            )}
          </div>
        </nav>

        {mobileMenuOpen && isMobileNav && (
          <div
            className="mobile-menu"
            style={{
              marginTop: 10,
              background: mode === 'dark'
                ? 'linear-gradient(180deg, rgba(19, 22, 24, 0.98), rgba(15, 18, 19, 0.98))'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 249, 246, 0.98))',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: 22,
              border: '1px solid color-mix(in srgb, var(--border) 84%, transparent)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              boxShadow: mode === 'dark' ? '0 18px 42px rgba(0,0,0,0.5)' : '0 18px 42px rgba(15,23,42,0.12)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {currentUser && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 18,
                  background: 'color-mix(in srgb, var(--paper2) 74%, transparent)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '1px solid color-mix(in srgb, var(--border) 88%, transparent)',
                  }}
                >
                  <img src={currentUser.picture} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentUser.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4, fontSize: '0.75rem', color: 'var(--muted-ink)' }}>
                    <span>{todayCount} applied today</span>
                    {streak > 0 && <span style={{ color: 'var(--warning)', fontWeight: 700 }}>#{streak} streak</span>}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 8 }}>
              {mobileNavLink('/jobs', COPY.nav.browseJobs, <Zap size={17} />, 'Fresh roles from company career pages')}
              {mobileNavLink('/directory', COPY.nav.companies, <Building2 size={17} />, 'Explore hiring teams across India')}
              {mobileNavLink('/progress', COPY.nav.myProgress, <BarChart3 size={17} />, 'Track applications, streaks, and reminders')}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isNarrowMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                gap: 8,
              }}
            >
              <button
                onClick={toggle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  minHeight: 46,
                  borderRadius: 14,
                  border: '1px solid var(--border)',
                  background: 'var(--paper2)',
                  color: 'var(--muted-ink)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                }}
              >
                {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {mode === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>

              {currentUser && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openSkillsEditor();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    minHeight: 46,
                    borderRadius: 14,
                    border: '1px solid var(--border)',
                    background: 'var(--paper2)',
                    color: 'var(--muted-ink)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                  }}
                >
                  <BookOpen size={15} />
                  My Skills
                </button>
              )}
            </div>

            {currentUser && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  minHeight: 48,
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted-ink)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <LogOut size={15} />
                Sign Out
              </button>
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
