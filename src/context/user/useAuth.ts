// FILE: src/context/user/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import type { AppUser } from './types';

/** Manages the logged-in user (cookie session). */
export function useAuth() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (r.ok) { const user = await r.json(); setCurrentUser(user); }
        else setCurrentUser(null);
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setIsLoading(false));
  }, []);

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

  const rawLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setCurrentUser(null);
  }, []);

  return { currentUser, setCurrentUser, isLoading, login, rawLogout };
}
