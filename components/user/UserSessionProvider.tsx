'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { userApi, UserApiError } from '@/lib/user/api-client';
import type { User } from '@/lib/user/types';

type SessionStatus = 'loading' | 'authenticated' | 'anonymous' | 'expired';
type SessionContextValue = { user: User | null; status: SessionStatus; refresh: () => Promise<User | null>; logout: () => Promise<void> };
const SessionContext = createContext<SessionContextValue | null>(null);

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const refresh = useCallback(async () => {
    try { const current = await userApi.me(); setUser(current); setStatus('authenticated'); return current; }
    catch (error) { setUser(null); setStatus(error instanceof UserApiError && error.status === 401 ? 'expired' : 'anonymous'); return null; }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const logout = useCallback(async () => { try { await userApi.logout(); } finally { setUser(null); setStatus('anonymous'); } }, []);
  const value = useMemo(() => ({ user, status, refresh, logout }), [user, status, refresh, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useUserSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useUserSession must be used within UserSessionProvider');
  return value;
}
