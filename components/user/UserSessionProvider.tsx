'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { userApi, UserApiError } from '@/lib/user/api-client';
import type { User } from '@/lib/user/types';

type SessionStatus = 'loading' | 'authenticated' | 'anonymous' | 'expired';
type SessionContextValue = { newsletterEntry: {email:string;existing:boolean}|null; setNewsletterEntry: (entry:{email:string;existing:boolean}|null)=>void; completeSignup: (user:User)=>void; user: User | null; status: SessionStatus; refresh: () => Promise<User | null>; logout: () => Promise<void> };
const SessionContext = createContext<SessionContextValue | null>(null);

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
  const [newsletterEntry,setNewsletterEntry]=useState<{email:string;existing:boolean}|null>(null);
  const revision=useRef(0);
  const completeSignup=useCallback((current:User)=>{revision.current++;setUser(current);setStatus('authenticated');},[]);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');
  const refresh = useCallback(async () => {
    const currentRevision=++revision.current;
    try { const current = await userApi.me(); if(currentRevision===revision.current){setUser(current); setStatus('authenticated');} return current; }
    catch (error) { if(currentRevision===revision.current){setUser(null); setStatus(error instanceof UserApiError && error.status === 401 ? 'expired' : 'anonymous');} return null; }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const logout = useCallback(async () => { try { await userApi.logout(); } finally { revision.current++;setNewsletterEntry(null);setUser(null); setStatus('anonymous'); } }, []);
  const value = useMemo(() => ({ user, status, refresh, logout,completeSignup,newsletterEntry,setNewsletterEntry }), [user, status, refresh, logout,completeSignup,newsletterEntry]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useUserSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useUserSession must be used within UserSessionProvider');
  return value;
}
