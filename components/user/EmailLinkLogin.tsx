'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/user/api-client';
import { useUserSession } from './UserSessionProvider';

export function EmailLinkLogin({ locale }: { locale: 'fr' | 'en' }) {
  const fr = locale === 'fr'; const router = useRouter(); const { refresh } = useUserSession();
  const [token, setToken] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    setToken(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname);
  }, []);
  async function connect() {
    setBusy(true); setError('');
    try { await userApi.consumeLoginLink(token); await refresh(); router.replace(fr ? '/fr/mon-compte' : '/account'); }
    catch { setError(fr ? 'Ce lien est invalide ou expiré. Demandez un nouveau lien.' : 'This link is invalid or expired. Request a new link.'); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-lg space-y-6 px-6 py-16"><h1 className="text-3xl font-bold">{fr ? 'Connexion par e-mail' : 'Email sign-in'}</h1><button className="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50" disabled={busy || !token} onClick={() => void connect()}>{fr ? 'Me connecter' : 'Sign in'}</button>{error && <p role="alert">{error}</p>}<p><Link className="underline" href={fr ? '/fr/connexion' : '/login'}>{fr ? 'Recevoir un nouveau lien' : 'Request a new link'}</Link></p></main>;
}
