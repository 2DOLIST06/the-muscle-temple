'use client';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useUserSession } from './UserSessionProvider';
import { userApi, UserApiError } from '@/lib/user/api-client';
import type { ContactDetails, User } from '@/lib/user/types';
import { NewsletterPreferencesForm } from '@/components/newsletter/NewsletterPreferencesForm';
import { subscribeToNewsletter } from '@/lib/newsletter';

type Locale = 'fr' | 'en';
const field = 'mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3';
const button = 'rounded-xl bg-brand-700 px-5 py-3 font-bold text-white disabled:opacity-50';
const contactFields = [
  ['firstName', 'Prénom', 'First name', 'given-name', 100],
  ['lastName', 'Nom', 'Last name', 'family-name', 100],
  ['phone', 'Téléphone', 'Phone', 'tel', 40],
  ['address', 'Adresse', 'Address', 'street-address', 250],
  ['postalCode', 'Code postal', 'Postal code', 'postal-code', 20],
  ['city', 'Ville', 'City', 'address-level2', 100],
  ['country', 'Pays', 'Country', 'country-name', 100]
] as const;

function ContactForm({ user, locale }: { user: User; locale: Locale }) {
  const fr = locale === 'fr';
  const [details, setDetails] = useState<ContactDetails>(() => Object.fromEntries(contactFields.map(([key]) => [key, user[key] ?? ''])) as unknown as ContactDetails);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try { await userApi.updateProfile(details); setMessage(fr ? 'Coordonnées enregistrées.' : 'Contact details saved.'); }
    catch { setError(fr ? 'Impossible d’enregistrer vos coordonnées. Réessayez.' : 'Unable to save your contact details. Please try again.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={save} className="space-y-5">
    <p className="text-slate-600">{fr ? 'Ces informations sont facultatives. Vous pouvez les compléter ou les effacer à tout moment.' : 'These details are optional. You can add or remove them at any time.'}</p>
    <label className="block">{fr ? 'Email de connexion' : 'Sign-in email'}<input className={`${field} bg-slate-50`} type="email" value={user.email} readOnly /></label>
    {contactFields.map(([key, labelFr, labelEn, autoComplete, maxLength]) => <label key={key} className="block">{fr ? labelFr : labelEn}<input className={field} type={key === 'phone' ? 'tel' : 'text'} autoComplete={autoComplete} maxLength={maxLength} value={details[key] ?? ''} onChange={e => setDetails(current => ({ ...current, [key]: e.target.value }))} /></label>)}
    {error && <p role="alert" className="text-red-800">{error}</p>}{message && <p role="status" className="text-green-800">{message}</p>}
    <button disabled={busy} className={button}>{busy ? (fr ? 'Enregistrement…' : 'Saving…') : (fr ? 'Enregistrer mes coordonnées' : 'Save my contact details')}</button>
  </form>;
}

function PasswordForm({ locale }: { locale: Locale }) {
  const fr = locale === 'fr';
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
  return <form onSubmit={save} className="space-y-5"><label className="block">{fr ? 'Nouveau mot de passe (10 caractères minimum)' : 'New password (at least 10 characters)'}<input className={field} type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block">{fr ? 'Confirmer le mot de passe' : 'Confirm password'}<input className={field} type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>{error && <p role="alert" className="text-red-800">{error}</p>}{saved && <p role="status" className="text-green-800">{fr ? 'Mot de passe modifié.' : 'Password updated.'}</p>}<button disabled={busy} className={button}>{fr ? 'Enregistrer' : 'Save'}</button></form>;
}

function AccountNewsletter({ user, locale }: { user: User; locale: Locale }) {
  const fr = locale === 'fr';
  const [subscription, setSubscription] = useState<{ token: string | null; status: string | null } | null>(null);
  const [verification, setVerification] = useState(false); const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [sent, setSent] = useState(false);
  async function load() {
    setError('');
    try { setSubscription(await userApi.newsletter()); setVerification(false); }
    catch (caught) {
      if (caught instanceof UserApiError && caught.code === 'EMAIL_VERIFICATION_REQUIRED') setVerification(true);
      else setError(fr ? 'Impossible de charger vos préférences.' : 'Unable to load your preferences.');
    }
  }
  useEffect(() => { void load(); }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  async function act() {
    setBusy(true); setError('');
    try {
      if (verification) { await userApi.requestLoginLink(user.email, locale); setSent(true); }
      else { await subscribeToNewsletter(user.email, locale, 'account', consent); await load(); }
    } catch { setError(fr ? 'Action impossible. Réessayez dans quelques instants.' : 'Unable to complete this action. Please try again shortly.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-5">
    {error && <p role="alert" className="text-red-800">{error}<button className="ml-3 underline" onClick={() => void load()}>{fr ? 'Réessayer' : 'Try again'}</button></p>}
    {verification ? <><p>{fr ? 'Pour accéder aux préférences associées à cette adresse, confirmez votre email avec un lien de connexion.' : 'To access the preferences for this address, confirm your email using a sign-in link.'}</p>{sent ? <p role="status">{fr ? 'Lien envoyé. Ouvrez-le pour revenir à votre compte.' : 'Link sent. Open it to return to your account.'}</p> : <button className={button} disabled={busy} onClick={() => void act()}>{fr ? 'Recevoir le lien de confirmation' : 'Send confirmation link'}</button>}</> : !subscription ? (!error && <p>{fr ? 'Chargement…' : 'Loading…'}</p>) : <>
      {subscription.token && subscription.status !== 'unsubscribed' ? <NewsletterPreferencesForm token={subscription.token} locale={locale} /> : <>
        <p>{fr ? 'Vous n’êtes pas abonné à la newsletter.' : 'You are not subscribed to the newsletter.'}</p>
        <p className="text-slate-600">{user.email}</p>
        <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>{fr ? 'J’accepte de recevoir la newsletter Body Training Guide par email.' : 'I agree to receive the Body Training Guide newsletter by email.'}</span></label>
        <button className={button} disabled={busy || !consent} onClick={() => void act()}>{fr ? 'M’inscrire à la newsletter' : 'Subscribe to the newsletter'}</button>
      </>}
    </>}
  </div>;
}

export function AccountPage({ locale }: { locale: Locale }) {
  const fr = locale === 'fr'; const { user, status } = useUserSession();
  const [tab, setTab] = useState<'contact' | 'password' | 'newsletter'>('contact');
  if (status === 'loading') return <main className="p-8">{fr ? 'Chargement…' : 'Loading…'}</main>;
  if (!user) return <main className="p-8"><Link href={fr ? '/fr/connexion?returnTo=/fr/mon-compte' : '/login?returnTo=/account'}>{fr ? 'Se connecter' : 'Log in'}</Link></main>;
  const tabs = [
    { id: 'contact', label: fr ? 'Mes coordonnées' : 'My contact details' },
    { id: 'password', label: fr ? 'Mon mot de passe' : 'My password' },
    { id: 'newsletter', label: fr ? 'Mes préférences newsletter' : 'My newsletter preferences' }
  ] as const;
  return <main className="mx-auto max-w-3xl space-y-8 px-6 py-16">
    <h1 className="text-3xl font-bold">{fr ? 'Mon compte' : 'My account'}</h1>
    <div role="tablist" aria-label={fr ? 'Paramètres du compte' : 'Account settings'} className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">{tabs.map((item, index) => <button key={item.id} role="tab" id={`tab-${item.id}`} aria-controls={`panel-${item.id}`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next === null) return; event.preventDefault(); setTab(tabs[next].id); document.getElementById(`tab-${tabs[next].id}`)?.focus();
    }} className={`rounded-xl px-4 py-3 text-sm font-semibold ${tab === item.id ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{item.label}</button>)}</div>
    {tabs.map(item => <section key={item.id} role="tabpanel" id={`panel-${item.id}`} aria-labelledby={`tab-${item.id}`} hidden={tab !== item.id} tabIndex={0} className="space-y-6">
      <h2 className="text-xl font-bold">{item.label}</h2>
      {item.id === 'contact' ? <ContactForm key={user.id} user={user} locale={locale} /> : item.id === 'password' ? <PasswordForm locale={locale} /> : tab === 'newsletter' && <AccountNewsletter user={user} locale={locale} />}
    </section>)}
  </main>;
}
