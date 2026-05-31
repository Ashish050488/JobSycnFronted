// FILE: src/context/UserContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { AppliedJobEntry } from '../types';
import { getStreak, getTodayCount } from '../utils/progress';

export interface AppUser {
  name: string;
  email: string;
  picture: string;
  slug: string;
}

interface UserCtx {
  currentUser: AppUser | null;
  isLoading: boolean;
  isUserDataLoading: boolean;
  userSkills: string[];
  appliedJobs: AppliedJobEntry[];
  appliedCount: number;
  appliedJobIds: Set<string>;
  dismissedJobIds: Set<string>;
  previousVisitAt: string | null;
  todayCount: number;
  streak: number;
  dailyGoal: number;
  skillsEditorOpen: boolean;
  openSkillsEditor: () => void;
  closeSkillsEditor: () => void;
  saveSkills: (skills: string[]) => Promise<void>;
  saveDailyGoal: (goal: number) => Promise<void>;
  toggleApplied: (jobId: string) => Promise<void>;
  toggleDismissed: (jobId: string) => Promise<void>;
  logout: () => void;
  login: (credential: string) => Promise<void>;
  updateStage: (jobId: string, stage: string) => Promise<void>;
}

const Ctx = createContext<UserCtx>({
  currentUser: null, isLoading: true, isUserDataLoading: false,
  userSkills: [], appliedJobs: [], appliedCount: 0,
  appliedJobIds: new Set(), dismissedJobIds: new Set(),
  previousVisitAt: null, todayCount: 0, streak: 0, dailyGoal: 5,
  skillsEditorOpen: false,
  openSkillsEditor: () => { }, closeSkillsEditor: () => { },
  saveSkills: async () => { }, saveDailyGoal: async () => { },
  toggleApplied: async () => { }, toggleDismissed: async () => { },
  updateStage: async () => { },
  logout: () => { }, login: async () => { },
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(false);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<AppliedJobEntry[]>([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [previousVisitAt, setPreviousVisitAt] = useState<string | null>(null);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [dismissedJobIds, setDismissedJobIds] = useState<Set<string>>(new Set());
  const [skillsEditorOpen, setSkillsEditorOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (r.ok) { const user = await r.json(); setCurrentUser(user); }
        else setCurrentUser(null);
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUserSkills([]); setAppliedJobs([]); setAppliedCount(0);
      setPreviousVisitAt(null); setDailyGoal(5);
      setDismissedJobIds(new Set()); setIsUserDataLoading(false);
      return;
    }
    let cancelled = false;
    setIsUserDataLoading(true);

    Promise.all([
      fetch('/api/me', { credentials: 'include' }).then(r => {
        if (r.status === 401) throw new Error('Unauthorized');
        return r.ok ? r.json() : null;
      }),
      fetch('/api/me/applied', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
      fetch('/api/me/visit', { method: 'PATCH', credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ])
      .then(([userData, appliedData, visitData]: [{ skills?: string[]; dailyGoal?: number; appliedCount?: number; dismissedJobIds?: string[] } | null, AppliedJobEntry[], { previousVisitAt: string | null } | null]) => {
        if (cancelled) return;
        setUserSkills(Array.isArray(userData?.skills) ? userData.skills : []);
        setDailyGoal(userData?.dailyGoal ?? 5);
        if (Array.isArray(userData?.dismissedJobIds)) setDismissedJobIds(new Set(userData.dismissedJobIds as string[]));
        const nextApplied = Array.isArray(appliedData) ? appliedData : [];
        setAppliedJobs(nextApplied);
        setAppliedCount(userData?.appliedCount ?? nextApplied.length);
        setPreviousVisitAt(visitData?.previousVisitAt ?? null);
      })
      .catch(err => { if (err.message === 'Unauthorized') setCurrentUser(null); })
      .finally(() => { if (!cancelled) setIsUserDataLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.email]);

  const appliedJobIds = useMemo(() => new Set(appliedJobs.map(e => e.jobId)), [appliedJobs]);
  const todayCount = useMemo(() => getTodayCount(appliedJobs), [appliedJobs]);
  const streak = useMemo(() => getStreak(appliedJobs), [appliedJobs]);

  const login = useCallback(async (credential: string) => {
    const r = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential }),
    });
    if (!r.ok) throw new Error('Google login failed');
    const { user } = await r.json();
    setCurrentUser(user);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setCurrentUser(null);
    setUserSkills([]); setAppliedJobs([]); setAppliedCount(0);
    setPreviousVisitAt(null); setDailyGoal(5);
    setDismissedJobIds(new Set());
  }, []);

  const openSkillsEditor = useCallback(() => setSkillsEditorOpen(true), []);
  const closeSkillsEditor = useCallback(() => setSkillsEditorOpen(false), []);

  const saveSkills = useCallback(async (skills: string[]) => {
    if (!currentUser) return;
    try {
      const r = await fetch('/api/me/skills', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ skills }),
      });
      if (r.ok) {
        const data = await r.json() as string[];
        setUserSkills(Array.isArray(data) ? data : skills);
      }
    } catch { /* silent */ }
  }, [currentUser]);

  const saveDailyGoal = useCallback(async (goal: number) => {
    if (!currentUser) return;
    const nextGoal = Math.max(1, Math.min(50, goal || 5));
    setDailyGoal(nextGoal);
    try {
      const r = await fetch('/api/me/goal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ goal: nextGoal }),
      });
      if (r.ok) {
        const data = await r.json() as { dailyGoal?: number };
        if (typeof data.dailyGoal === 'number') setDailyGoal(data.dailyGoal);
      }
    } catch { /* leave optimistic */ }
  }, [currentUser]);

  const toggleApplied = useCallback(async (jobId: string) => {
    if (!currentUser) return;
    const encodedJobId = encodeURIComponent(jobId);
    const exists = appliedJobIds.has(jobId);
    const existingEntry = appliedJobs.find(e => e.jobId === jobId) ?? null;
    const optimistic = { jobId, appliedAt: new Date().toISOString() };
    if (!exists) setAppliedCount(prev => prev + 1);
    setAppliedJobs(prev => exists ? prev.filter(e => e.jobId !== jobId) : [...prev, optimistic]);
    try {
      const r = await fetch(`/api/me/applied/${encodedJobId}`, { method: exists ? 'DELETE' : 'POST', credentials: 'include' });
      if (!r.ok) throw new Error('Failed to toggle applied');
      const data = await r.json() as AppliedJobEntry[];
      setAppliedJobs(Array.isArray(data) ? data : []);
    } catch {
      if (!exists) setAppliedCount(prev => Math.max(0, prev - 1));
      setAppliedJobs(prev => exists ? (existingEntry ? [...prev, existingEntry] : prev) : prev.filter(e => e.jobId !== jobId));
    }
  }, [currentUser, appliedJobIds, appliedJobs]);

  const updateStage = useCallback(async (jobId: string, stage: string) => {
    if (!currentUser) return;
    const encodedJobId = encodeURIComponent(jobId);
    setAppliedJobs(prev => prev.map(entry =>
      entry.jobId === jobId ? { ...entry, stage, stageUpdatedAt: new Date().toISOString() } : entry
    ));
    try {
      const r = await fetch(`/api/me/applied/${encodedJobId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stage }),
      });
      if (!r.ok) throw new Error('Failed to update stage');
      const data = await r.json();
      setAppliedJobs(Array.isArray(data) ? data : []);
    } catch {
      try {
        const r = await fetch('/api/me/applied', { credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          setAppliedJobs(Array.isArray(data) ? data : []);
        }
      } catch { /* silent */ }
    }
  }, [currentUser]);

  const toggleDismissed = useCallback(async (jobId: string) => {
    if (!currentUser) return;
    const encoded = encodeURIComponent(jobId);
    const isDismissed = dismissedJobIds.has(jobId);
    setDismissedJobIds(prev => {
      const next = new Set(prev);
      if (isDismissed) next.delete(jobId); else next.add(jobId);
      return next;
    });
    try {
      const r = await fetch(`/api/me/dismissed/${encoded}`, {
        method: isDismissed ? 'DELETE' : 'POST',
        credentials: 'include',
      });
      if (r.ok) {
        const ids = await r.json() as string[];
        setDismissedJobIds(new Set(ids));
      }
    } catch { /* leave optimistic */ }
  }, [currentUser, dismissedJobIds]);

  return (
    <Ctx.Provider value={{
      currentUser, isLoading, isUserDataLoading, userSkills, appliedJobs, appliedCount,
      appliedJobIds, dismissedJobIds, previousVisitAt, todayCount, streak, dailyGoal,
      skillsEditorOpen, openSkillsEditor, closeSkillsEditor, saveSkills, saveDailyGoal,
      toggleApplied, toggleDismissed, updateStage, logout, login,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useUser = () => useContext(Ctx);
