// FILE: src/components/layouts/AppLayoutModern.tsx
// Top-level layout. Composes TopNav + BottomNav (mobile) + Footer (desktop) around the routed page.

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Briefcase, Building2, Home as HomeIcon, BarChart3,
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';
import { useSeeker } from '../../context/seeker/SeekerContext';
import SkillsEditor from '../seeker/SkillsEditor';
import Footer from './Footer';
import TopNav from './parts/TopNav';
import BottomNav from './parts/BottomNav';
import { useViewport } from '../../hooks/shared/useViewport';
import type { NavItem } from './parts/types';

export default function AppLayoutModern() {
  const { mode, toggle } = useTheme();
  const {
    currentUser, logout, skillsEditorOpen, openSkillsEditor, closeSkillsEditor,
    todayCount, streak,
  } = useSeeker();

  const vp = useViewport();
  const isMobile = vp.w < 768;
  const isCompact = vp.w < 1024;

  const location = useLocation();
  // Reset scroll on route change so a new page never paints mid-scroll over the old one.
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const navItems: NavItem[] = currentUser ? [
    { to: '/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
    { to: '/today', label: 'Today', icon: <HomeIcon size={18} /> },
    { to: '/directory', label: 'Companies', icon: <Building2 size={18} /> },
    { to: '/progress', label: 'Progress', icon: <BarChart3 size={18} /> },
  ] : [
    { to: '/', label: 'Home', icon: <HomeIcon size={18} /> },
    { to: '/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
    { to: '/directory', label: 'Companies', icon: <Building2 size={18} /> },
  ];

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--paper)',
    }}>
      <TopNav
        isMobile={isMobile}
        isCompact={isCompact}
        navItems={navItems}
        currentUser={currentUser}
        todayCount={todayCount}
        streak={streak}
        themeMode={mode}
        onToggleTheme={toggle}
        onOpenSkillsEditor={openSkillsEditor}
        onLogout={logout}
      />

      <main
        className={isMobile ? 'has-bottom-nav' : ''}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* key by path forces a clean unmount/remount per route — prevents the
            previous page's nodes from lingering/overlapping during navigation. */}
        <div key={location.pathname} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </div>
      </main>

      {!isMobile && <Footer />}
      {isMobile && <BottomNav items={navItems} />}

      {skillsEditorOpen && <SkillsEditor onClose={closeSkillsEditor} />}
    </div>
  );
}
