'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { userApi, UserApiError } from '@/lib/user/api-client';
import { useUserSession } from './UserSessionProvider';

export function AuthForm({ locale, mode }: { locale: 'fr' | 'en'; mode: 'login' | 'register' }) {
  const french = locale === 'fr';
  const router = useRouter(); const params = useSearchParams(); const { refresh } = useUserSession();
  const [emailLink, setEmailLink] = useState(false); const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [displayName, setDisplayName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const loginPath = french ? '/fr/connexion' : '/login'; const registerPath = french ? '/fr/inscription' : '/register';
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSent(false);
    if (mode === 'register' && password !== confirmation) { setError(french ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.'); return; }
    setBusy(true);
    try {
      if (emailLink) { await userApi.requestLoginLink(email.trim().toLowerCase(), locale); setSent(true); return; }
      if (mode === 'login') await userApi.login({ email: email.trim().toLowerCase(), password });
      else await userApi.register({ displayName: displayName.trim(), email: email.trim().toLowerCase(), password });
      await refresh();
      const returnTo = params.get('returnTo');
      router.replace(returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : (french ? '/fr/suivi-nutrition' : '/nutrition-tracker'));
    } catch (cause) {
      const status = cause instanceof UserApiError ? cause.status : 0;
      if (emailLink) {
        const code = cause instanceof UserApiError ? cause.code : undefined;
        setError(code === 'ACCOUNT_NOT_FOUND' ? (french ? 'Aucun compte avec cette adresse e-mail. Vous pouvez créer un compte.' : 'No account with this email address. You can create an account.')
          : code === 'MEMBER_ACCOUNT_REQUIRED' ? (french ? 'Cette adresse ne correspond pas à un compte membre. Utilisez l’adresse de votre compte membre.' : 'This address is not a member account. Use your member account email.')
          : status === 429 ? (french ? 'Veuillez patienter une minute avant de réessayer.' : 'Please wait a minute before trying again.')
          : (french ? 'Impossible d’envoyer le mail de connexion. Veuillez réessayer.' : 'Unable to send the sign-in email. Please try again.'));
        return;
      }
      setError(status === 409 ? (french ? 'Cette adresse e-mail est déjà utilisée.' : 'This email address is already in use.') : status === 400 || status === 422 ? (french ? 'Vérifiez les informations saisies.' : 'Please check the information you entered.') : status === 0 ? (french ? 'Impossible de joindre le serveur. Réessayez.' : 'Unable to reach the server. Please try again.') : (french ? 'E-mail ou mot de passe incorrect.' : 'Incorrect email or password.'));
    } finally { setBusy(false); }
  };
  const field = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50';
  return <form onSubmit={submit} className="mt-8 space-y-5">
    {mode === 'register' ? <label className="block text-sm font-semibold text-slate-800">{french ? 'Nom affiché' : 'Display name'}<input className={field} required minLength={2} maxLength={80} autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label> : null}
    <label className="block text-sm font-semibold text-slate-800">{french ? 'Adresse e-mail' : 'Email address'}<input className={field} required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
    {!emailLink && <label className="block text-sm font-semibold text-slate-800">{french ? 'Mot de passe' : 'Password'}<input className={field} required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
    {mode === 'register' ? <label className="block text-sm font-semibold text-slate-800">{french ? 'Confirmer le mot de passe' : 'Confirm password'}<input className={field} required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label> : null}
    {sent ? <p role="status" className="text-sm text-green-800">{french ? 'Un lien de connexion a été envoyé à votre adresse e-mail. Vérifiez aussi vos courriers indésirables.' : 'A sign-in link has been sent to your email address. Please also check your spam folder.'}</p> : null}
    {mode === 'login' ? <button type="button" disabled={busy} className="text-sm font-semibold text-brand-700 underline" onClick={() => { setEmailLink(!emailLink); setError(''); setSent(false); }}>{emailLink ? (french ? 'Utiliser mon mot de passe' : 'Use my password') : (french ? 'Mot de passe oublié ? Recevoir un lien de connexion' : 'Forgot password? Email me a sign-in link')}</button> : null}
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p> : null}
    <button disabled={busy} className="w-full rounded-xl bg-brand-700 px-5 py-3 font-bold text-white transition hover:bg-brand-500 disabled:cursor-wait disabled:opacity-60">{busy ? (french ? 'Veuillez patienter…' : 'Please wait…') : emailLink ? (french ? 'Recevoir mon lien' : 'Send sign-in link') : mode === 'login' ? (french ? 'Se connecter' : 'Log in') : (french ? 'Créer mon compte' : 'Create my account')}</button>
    <p className="text-center text-sm text-slate-600">{mode === 'login' ? (french ? 'Pas encore de compte ?' : 'New here?') : (french ? 'Vous avez déjà un compte ?' : 'Already have an account?')} <Link className="font-bold text-brand-700 underline" href={mode === 'login' ? registerPath : loginPath}>{mode === 'login' ? (french ? 'Créer un compte' : 'Create account') : (french ? 'Se connecter' : 'Log in')}</Link></p>
  </form>;
}
