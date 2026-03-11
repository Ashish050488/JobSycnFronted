import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { lightVars, darkVars } from './themes';

type Mode = 'light' | 'dark';

interface ThemeCtx {
  mode: Mode;
  toggle: () => void;
  isDark: boolean;
}

const Ctx = createContext<ThemeCtx>({ mode: 'light', toggle: () => { }, isDark: false });

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem('ej-theme') as Mode | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    applyVars(mode === 'dark' ? darkVars : lightVars);
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('ej-theme', mode);
  }, [mode]);

  const toggle = () => setMode(m => m === 'dark' ? 'light' : 'dark');

  return (
    <Ctx.Provider value={{ mode, toggle, isDark: mode === 'dark' }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
