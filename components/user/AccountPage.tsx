'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useUserSession } from './UserSessionProvider';
import { userApi } from '@/lib/user/api-client';
import type { ContactDetails, User } from '@/lib/user/types';
import { NewsletterPreferencesForm } from '@/components/newsletter/NewsletterPreferencesForm';
import { NutritionTracker } from '@/components/nutrition/NutritionTracker';
import { NewsletterSignup } from '@/components/blog/NewsletterCta';
import { AuthForm } from './AuthForm';
import { useSearchParams } from 'next/navigation';

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
  return <NewsletterPreferencesForm key={user.id} locale={locale} />;
}

export function AccountPage({ locale }: { locale: Locale }) {
  const fr = locale === 'fr'; const { user, status,newsletterEntry,setNewsletterEntry,logout } = useUserSession();
  const params=useSearchParams();
  const [tab, setTab] = useState<'contact' | 'password' | 'newsletter' | 'tracker'>(params.get('tab')==='newsletter'?'newsletter':'contact');
  useEffect(()=>{if(params.get('tab')==='newsletter' || (newsletterEntry && !newsletterEntry.existing))setTab('newsletter');},[params,newsletterEntry]);
  if (status === 'loading') return <main className="p-8">{fr ? 'Chargement…' : 'Loading…'}</main>;
  if (!user) return <main className="mx-auto max-w-3xl space-y-6 px-6 py-16"><h1 className="text-3xl font-bold">{fr?'Mon compte':'My account'}</h1>
    {newsletterEntry?.existing ? <><p role="status" className="rounded-xl bg-blue-50 p-4 text-blue-900">{fr?'Cette adresse possède déjà un compte ou un abonnement. Connectez-vous pour retrouver vos préférences.':'This email already has an account or subscription. Sign in to manage your preferences.'}</p><AuthForm locale={locale} mode="login" initialEmail={newsletterEntry.email} /></> : <NewsletterSignup locale={locale} source="account" />}
    {newsletterEntry && <button className="underline" onClick={()=>setNewsletterEntry(null)}>{fr?'Inscrire une autre adresse email':'Subscribe another email address'}</button>}
  </main>;
  const tabs = [
    { id: 'contact', label: fr ? 'Mes coordonnées' : 'My contact details' },
    { id: 'password', label: fr ? 'Mon mot de passe' : 'My password' },
    { id: 'newsletter', label: fr ? 'Mes préférences newsletter' : 'My newsletter preferences' },
    { id: 'tracker', label: fr ? 'Mon suivi alimentaire' : 'My food tracker' }
  ] as const;
  return <main className={`mx-auto ${tab === 'tracker' ? 'max-w-7xl' : 'max-w-3xl'} space-y-8 px-6 py-16`}>
    <h1 className="text-3xl font-bold">{fr ? 'Mon compte' : 'My account'}</h1>
    <p className="text-slate-600">{user.email}</p>
    {newsletterEntry && !newsletterEntry.existing && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-900">{fr?'Votre inscription a bien été prise en compte. Vous pouvez modifier vos préférences.':'Your subscription has been saved. You can change your preferences.'}</p>}
    <div role="tablist" aria-label={fr ? 'Paramètres du compte' : 'Account settings'} className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">{tabs.map((item, index) => <button key={item.id} role="tab" id={`tab-${item.id}`} aria-controls={`panel-${item.id}`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
      if (next === null) return; event.preventDefault(); setTab(tabs[next].id); document.getElementById(`tab-${tabs[next].id}`)?.focus();
    }} className={`rounded-xl px-4 py-3 text-sm font-semibold ${tab === item.id ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{item.label}</button>)}</div>
    {tabs.map(item => <section key={item.id} role="tabpanel" id={`panel-${item.id}`} aria-labelledby={`tab-${item.id}`} hidden={tab !== item.id} tabIndex={0} className="space-y-6">
      <h2 className="text-xl font-bold">{item.label}</h2>
      {item.id === 'contact' ? <ContactForm key={user.id} user={user} locale={locale} /> : item.id === 'password' ? <PasswordForm locale={locale} /> : item.id === 'newsletter' ? tab === 'newsletter' && <AccountNewsletter user={user} locale={locale} /> : tab === 'tracker' && <NutritionTracker locale={locale} embedded />}
    </section>)}
    <p className="border-t border-slate-200 pt-5"><button className="text-sm underline" onClick={()=>void logout()}>{fr?'Se déconnecter pour utiliser une autre adresse email':'Sign out to use another email address'}</button></p>
  </main>;
}
