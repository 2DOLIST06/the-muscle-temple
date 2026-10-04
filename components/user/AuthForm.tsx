'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { userApi, UserApiError } from '@/lib/user/api-client';
import { useUserSession } from './UserSessionProvider';

export function AuthForm({ locale, mode }: { locale: 'fr' | 'en'; mode: 'login' | 'register' }) {
  const french = locale === 'fr';
  const router = useRouter(); const params = useSearchParams(); const { refresh } = useUserSession();
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const loginPath = french ? '/fr/connexion' : '/login'; const registerPath = french ? '/fr/inscription' : '/register';
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (mode === 'register' && password !== confirmation) { setError(french ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.'); return; }
    setBusy(true);
    try {
      if (mode === 'login') await userApi.login({ email: email.trim().toLowerCase(), password });
      else await userApi.register({ displayName: displayName.trim(), email: email.trim().toLowerCase(), password });
      await refresh();
      const returnTo = params.get('returnTo');
      router.replace(returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : (french ? '/fr/suivi-nutrition' : '/nutrition-tracker'));
    } catch (cause) {
      const status = cause instanceof UserApiError ? cause.status : 0;
      setError(status === 409 ? (french ? 'Cette adresse e-mail est déjà utilisée.' : 'This email address is already in use.') : status === 400 || status === 422 ? (french ? 'Vérifiez les informations saisies.' : 'Please check the information you entered.') : status === 0 ? (french ? 'Impossible de joindre le serveur. Réessayez.' : 'Unable to reach the server. Please try again.') : (french ? 'E-mail ou mot de passe incorrect.' : 'Incorrect email or password.'));
    } finally { setBusy(false); }
  };
  const field = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50';
  return <form onSubmit={submit} className="mt-8 space-y-5">
    {mode === 'register' ? <label className="block text-sm font-semibold text-slate-800">{french ? 'Nom affiché' : 'Display name'}<input className={field} required minLength={2} maxLength={80} autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label> : null}
    <label className="block text-sm font-semibold text-slate-800">{french ? 'Adresse e-mail' : 'Email address'}<input className={field} required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    <label className="block text-sm font-semibold text-slate-800">{french ? 'Mot de passe' : 'Password'}<input className={field} required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    {mode === 'register' ? <label className="block text-sm font-semibold text-slate-800">{french ? 'Confirmer le mot de passe' : 'Confirm password'}<input className={field} required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label> : null}
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p> : null}
    <button disabled={busy} className="w-full rounded-xl bg-brand-700 px-5 py-3 font-bold text-white transition hover:bg-brand-500 disabled:cursor-wait disabled:opacity-60">{busy ? (french ? 'Veuillez patienter…' : 'Please wait…') : mode === 'login' ? (french ? 'Se connecter' : 'Log in') : (french ? 'Créer mon compte' : 'Create my account')}</button>
    <p className="text-center text-sm text-slate-600">{mode === 'login' ? (french ? 'Pas encore de compte ?' : 'New here?') : (french ? 'Vous avez déjà un compte ?' : 'Already have an account?')} <Link className="font-bold text-brand-700 underline" href={mode === 'login' ? registerPath : loginPath}>{mode === 'login' ? (french ? 'Créer un compte' : 'Create account') : (french ? 'Se connecter' : 'Log in')}</Link></p>
  </form>;
}
