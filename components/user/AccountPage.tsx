'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useUserSession } from './UserSessionProvider';
import { userApi } from '@/lib/user/api-client';

export function AccountPage({ locale }: { locale: 'fr' | 'en' }) {
  const fr = locale === 'fr'; const { user, status } = useUserSession();
  const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [saved, setSaved] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); setError(''); setSaved(false);
    if (password !== confirmation) { setError(fr ? 'Les mots de passe ne correspondent pas.' : 'Passwords do not match.'); return; }
    setBusy(true);
    try { await userApi.changePassword(password); setPassword(''); setConfirmation(''); setSaved(true); }
    catch { setError(fr ? 'Modification impossible. Vérifiez votre connexion et réessayez.' : 'Unable to save. Check your session and try again.'); }
    finally { setBusy(false); }
  }
  if (status === 'loading') return <main className="p-8">{fr ? 'Chargement…' : 'Loading…'}</main>;
  if (!user) return <main className="p-8"><Link href={fr ? '/fr/connexion?returnTo=/fr/mon-compte' : '/login?returnTo=/account'}>{fr ? 'Se connecter' : 'Log in'}</Link></main>;
  const field = 'mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3';
  return <main className="mx-auto max-w-lg space-y-6 px-6 py-16"><h1 className="text-3xl font-bold">{fr ? 'Mon compte' : 'My account'}</h1><p>{user.email}</p><h2 className="text-xl font-bold">{fr ? 'Modifier mon mot de passe' : 'Change my password'}</h2><form onSubmit={save} className="space-y-5"><label className="block">{fr ? 'Nouveau mot de passe (10 caractères minimum)' : 'New password (at least 10 characters)'}<input className={field} type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block">{fr ? 'Confirmer le mot de passe' : 'Confirm password'}<input className={field} type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>{error && <p role="alert" className="text-red-800">{error}</p>}{saved && <p role="status" className="text-green-800">{fr ? 'Mot de passe modifié.' : 'Password updated.'}</p>}<button disabled={busy} className="rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50">{fr ? 'Enregistrer' : 'Save'}</button></form></main>;
}
