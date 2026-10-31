'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/user/api-client';
import { useUserSession } from './UserSessionProvider';

export function EmailLinkLogin({ locale }: { locale: 'fr' | 'en' }) {
  const fr = locale === 'fr'; const router = useRouter(); const { refresh } = useUserSession();
  const [sent,setSent]=useState(false);
  const [token, setToken] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    setToken(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname);
  }, []);
  async function connect() {
    setBusy(true); setError('');
    try { await userApi.consumeLoginLink(token); await refresh(); router.replace(fr ? '/fr/mon-compte?tab=newsletter' : '/account?tab=newsletter'); }
    catch { setError(fr ? 'Ce lien est invalide ou expiré. Demandez un nouveau lien.' : 'This link is invalid or expired. Request a new link.'); }
    finally { setBusy(false); }
  }
  async function resend(){setBusy(true);setError('');setSent(false);try{await userApi.resendLoginLink(token,locale);setSent(true);}catch(cause){setError(cause && typeof cause==='object' && 'code' in cause && cause.code==='LOGIN_LINK_COOLDOWN'?(fr?'Veuillez patienter une minute avant de demander un nouveau lien.':'Please wait a minute before requesting another link.'):(fr?'Indiquez votre adresse sur la page de connexion pour recevoir un nouveau lien.':'Enter your email on the sign-in page to request a new link.'));}finally{setBusy(false);}}
  return <main className="mx-auto max-w-lg space-y-6 px-6 py-16"><h1 className="text-3xl font-bold">{fr ? 'Connexion par e-mail' : 'Email sign-in'}</h1><button className="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50" disabled={busy || !token} onClick={() => void connect()}>{fr ? 'Me connecter' : 'Sign in'}</button>{error && <p role="alert">{error}</p>}{sent&&<p role="status">{fr?'Un nouveau lien de connexion vous a été envoyé.':'A new sign-in link has been sent.'}</p>}<p><button disabled={busy||!token} className="underline" onClick={()=>void resend()}>{fr?'Recevoir un nouveau lien':'Request a new link'}</button></p><p><Link className="underline" href={fr?'/fr/connexion':'/login'}>{fr?'Se connecter avec une autre adresse':'Sign in with another email'}</Link></p></main>;
}
