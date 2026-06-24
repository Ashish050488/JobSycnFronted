// FILE: src/context/UserContext.tsx
// Orchestrator — composes domain hooks under ./user/ into one context.
// Individual concerns (auth, applied, dismissed, skills) live in sibling files.

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { AppliedJobEntry } from '../types';
import { getStreak, getTodayCount } from '../utils/progress';
import { useAuth } from './user/useAuth';
import { useApplied } from './user/useApplied';
import { useDismissed } from './user/useDismissed';
import { useSkillsAndGoal } from './user/useSkillsAndGoal';
import type { UserCtx, AppUser } from './user/types';

// Re-export for back-compat
export type { AppUser };

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
  const { currentUser, setCurrentUser, isLoading, login, rawLogout } = useAuth();
  const { userSkills, setUserSkills, dailyGoal, setDailyGoal, saveSkills, saveDailyGoal } = useSkillsAndGoal(currentUser);
  const { appliedJobs, setAppliedJobs, appliedCount, setAppliedCount, appliedJobIds, toggleApplied, updateStage } = useApplied(currentUser);
  const { dismissedJobIds, setDismissedJobIds, toggleDismissed } = useDismissed(currentUser);

  const [isUserDataLoading, setIsUserDataLoading] = useState(false);
  const [previousVisitAt, setPreviousVisitAt] = useState<string | null>(null);
  const [skillsEditorOpen, setSkillsEditorOpen] = useState(false);

  // Initial load of user data after auth resolves
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

  const todayCount = useMemo(() => getTodayCount(appliedJobs), [appliedJobs]);
  const streak = useMemo(() => getStreak(appliedJobs), [appliedJobs]);

  const logout = useCallback(async () => {
    await rawLogout();
    setUserSkills([]); setAppliedJobs([]); setAppliedCount(0);
    setPreviousVisitAt(null); setDailyGoal(5);
    setDismissedJobIds(new Set());
  }, [rawLogout]);

  const openSkillsEditor = useCallback(() => setSkillsEditorOpen(true), []);
  const closeSkillsEditor = useCallback(() => setSkillsEditorOpen(false), []);

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
