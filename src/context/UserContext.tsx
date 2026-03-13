// FILE: src/context/UserContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';

import type { AppliedJobEntry } from '../types';
import { getStreak, getTodayCount } from '../utils/progress';

/* ─── types ─────────────────────────────────────────────────────── */
export interface AppUser {
  name: string;
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
  /** Clear cookie + reset state → picker will re-appear */
  switchUser: () => void;
  /** Called by NamePicker once user taps a name */
  selectUser: (user: AppUser) => void;
}

const COOKIE_NAME = 'tj_user';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/* ─── cookie helpers ────────────────────────────────────────────── */
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`;
}

/* ─── context ───────────────────────────────────────────────────── */
const Ctx = createContext<UserCtx>({
  currentUser: null,
  isLoading: true,
  isUserDataLoading: false,
  userSkills: [],
  appliedJobs: [],
  appliedCount: 0,
  appliedJobIds: new Set(),
  previousVisitAt: null,
  todayCount: 0,
  streak: 0,
  dailyGoal: 5,
  skillsEditorOpen: false,
  openSkillsEditor: () => {},
  closeSkillsEditor: () => {},
  saveSkills: async () => {},
  saveDailyGoal: async () => {},
  toggleApplied: async () => {},
  switchUser: () => {},
  selectUser: () => {},
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
  const [skillsEditorOpen, setSkillsEditorOpen] = useState(false);

  // On mount — read cookie, resolve name from stored JSON
  useEffect(() => {
    const raw = getCookie(COOKIE_NAME);
    if (raw) {
      try {
        const parsed: AppUser = JSON.parse(raw);
        if (parsed.slug && parsed.name) {
          setCurrentUser(parsed);
        }
      } catch {
        deleteCookie(COOKIE_NAME);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setUserSkills([]);
      setAppliedJobs([]);
      setAppliedCount(0);
      setPreviousVisitAt(null);
      setDailyGoal(5);
      setIsUserDataLoading(false);
      return;
    }

    let cancelled = false;
    const slug = encodeURIComponent(currentUser.slug);
    setIsUserDataLoading(true);

    Promise.all([
      fetch(`/api/users/${slug}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/users/${slug}/applied`).then(r => r.ok ? r.json() : []),
      fetch(`/api/users/${slug}/visit`, { method: 'PATCH' }).then(r => r.ok ? r.json() : null),
    ])
      .then(([userData, appliedData, visitData]: [{ skills?: string[]; dailyGoal?: number; appliedCount?: number } | null, AppliedJobEntry[], { previousVisitAt: string | null } | null]) => {
        if (cancelled) return;
        setUserSkills(Array.isArray(userData?.skills) ? userData.skills : []);
        setDailyGoal(userData?.dailyGoal ?? 5);
        const nextAppliedJobs = Array.isArray(appliedData) ? appliedData : [];
        setAppliedJobs(nextAppliedJobs);
        setAppliedCount(userData?.appliedCount ?? nextAppliedJobs.length);
        setPreviousVisitAt(visitData?.previousVisitAt ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsUserDataLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentUser?.slug]);

  const appliedJobIds = useMemo(() => new Set(appliedJobs.map(entry => entry.jobId)), [appliedJobs]);
  const todayCount = useMemo(() => getTodayCount(appliedJobs), [appliedJobs]);
  const streak = useMemo(() => getStreak(appliedJobs), [appliedJobs]);

  const selectUser = useCallback((user: AppUser) => {
    setCookie(COOKIE_NAME, JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const switchUser = useCallback(() => {
    deleteCookie(COOKIE_NAME);
    setCurrentUser(null);
    setUserSkills([]);
    setAppliedJobs([]);
    setAppliedCount(0);
    setPreviousVisitAt(null);
    setDailyGoal(5);
  }, []);

  const openSkillsEditor = useCallback(() => setSkillsEditorOpen(true), []);
  const closeSkillsEditor = useCallback(() => setSkillsEditorOpen(false), []);

  const saveSkills = useCallback(async (skills: string[]) => {
    if (!currentUser) return;
    try {
      const r = await fetch(`/api/users/${encodeURIComponent(currentUser.slug)}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills }),
      });
      if (r.ok) {
        const data = await r.json() as { skills: string[] };
        setUserSkills(data.skills ?? skills);
      }
    } catch { /* silently fail — local state already has new skills */ }
  }, [currentUser]);

  const saveDailyGoal = useCallback(async (goal: number) => {
    if (!currentUser) return;
    const nextGoal = Math.max(1, Math.min(50, goal || 5));
    setDailyGoal(nextGoal);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(currentUser.slug)}/goal`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyGoal: nextGoal }),
      });
      if (response.ok) {
        const data = await response.json() as { dailyGoal?: number };
        if (typeof data.dailyGoal === 'number') setDailyGoal(data.dailyGoal);
      }
    } catch {
      // leave optimistic value in place
    }
  }, [currentUser]);

  const toggleApplied = useCallback(async (jobId: string) => {
    if (!currentUser) return;

    const slug = encodeURIComponent(currentUser.slug);
    const encodedJobId = encodeURIComponent(jobId);
    const exists = appliedJobIds.has(jobId);
    const existingEntry = appliedJobs.find(entry => entry.jobId === jobId) ?? null;
    const optimisticEntry = { jobId, appliedAt: new Date().toISOString() };

    if (!exists) setAppliedCount(prev => prev + 1);

    setAppliedJobs(prev => exists ? prev.filter(entry => entry.jobId !== jobId) : [...prev, optimisticEntry]);

    try {
      const response = await fetch(`/api/users/${slug}/applied/${encodedJobId}`, { method: exists ? 'DELETE' : 'POST' });
      if (!response.ok) throw new Error('Failed to toggle applied');
      const data = await response.json() as AppliedJobEntry[];
      setAppliedJobs(Array.isArray(data) ? data : []);
    } catch {
      if (!exists) setAppliedCount(prev => Math.max(0, prev - 1));
      setAppliedJobs(prev => exists
        ? (existingEntry ? [...prev, existingEntry] : prev)
        : prev.filter(entry => entry.jobId !== jobId)
      );
    }
  }, [currentUser, appliedJobIds, appliedJobs]);

  return (
    <Ctx.Provider value={{ currentUser, isLoading, isUserDataLoading, userSkills, appliedJobs, appliedCount, appliedJobIds, previousVisitAt, todayCount, streak, dailyGoal, skillsEditorOpen, openSkillsEditor, closeSkillsEditor, saveSkills, saveDailyGoal, toggleApplied, switchUser, selectUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useUser = () => useContext(Ctx);
