'use client';

import { useEffect, useState } from 'react';
import { userApi, UserApiError } from '@/lib/user/api-client';
import type { Locale } from '@/lib/i18n/routing';
import {
  getNewsletterPreferences,
  NEWSLETTER_FREQUENCIES,
  NEWSLETTER_GOALS,
  NEWSLETTER_TOPICS,
  unsubscribeFromNewsletter,
  updateNewsletterPreferences,
  type NewsletterFrequency,
  type NewsletterGoal,
  type NewsletterPreferences,
  type NewsletterTopic
} from '@/lib/newsletter';

interface Props { token?: string; locale: Locale; requestUnsubscribe?: boolean }

export function NewsletterPreferencesForm({ token, locale, requestUnsubscribe = false }: Props) {
  const [preferences, setPreferences] = useState<NewsletterPreferences | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'saving' | 'success' | 'error'; message: string } | null>(null);
  const [confirmingUnsubscribe, setConfirmingUnsubscribe] = useState(requestUnsubscribe);
  const [reactivating,setReactivating]=useState(false);
  const [verification,setVerification]=useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const copy = locale === 'fr' ? {
    loading: 'Chargement de vos préférences…', invalid: token ? 'Ce lien de préférences est invalide ou a expiré.' : 'Impossible de charger vos préférences.', retry: 'Réessayer',
    topics: 'Ce que je souhaite recevoir', goals: 'Mes objectifs', frequency: 'À quelle fréquence souhaitez-vous recevoir nos emails ?',
    save: 'Enregistrer mes préférences', saving: 'Enregistrement…', saved: 'Vos préférences ont bien été enregistrées.',
    saveError: 'Impossible d’enregistrer vos préférences. Réessayez dans quelques instants.', unsubscribe: 'Se désabonner',
    unsubscribeText: 'Vous ne recevrez plus les emails de Body Training Guide. Confirmez cette action pour vous désabonner.', confirm: 'Confirmer la désinscription', cancel: 'Annuler',
    unsubscribed: 'Vous êtes maintenant désabonné de la newsletter.', unsubscribedExisting: 'Cette adresse est déjà désabonnée.',
    topicsLabels: ['Nouveaux articles', 'Musculation et exercices', 'Programmes d’entraînement', 'Nutrition, calories et macros', 'Compléments alimentaires', 'Machines et matériel', 'Outils et calculateurs', 'Guides pratiques'],
    goalsLabels: ['Prise de muscle / hypertrophie', 'Perte de graisse / sèche', 'Force', 'Forme générale'],
    frequencyLabels: ['Dès qu’un nouveau contenu correspondant à mes préférences est publié', 'Une fois par semaine', 'Une fois par mois']
  } : {
    loading: 'Loading your preferences…', invalid: token ? 'This preferences link is invalid or has expired.' : 'Could not load your preferences.', retry: 'Try again',
    topics: 'What I would like to receive', goals: 'My goals', frequency: 'How often would you like to receive our emails?',
    save: 'Save my preferences', saving: 'Saving…', saved: 'Your preferences have been saved.',
    saveError: 'Could not save your preferences. Please try again shortly.', unsubscribe: 'Unsubscribe',
    unsubscribeText: 'You will no longer receive emails from Body Training Guide. Confirm this action to unsubscribe.', confirm: 'Confirm unsubscribe', cancel: 'Cancel',
    unsubscribed: 'You are now unsubscribed from the newsletter.', unsubscribedExisting: 'This address is already unsubscribed.',
    topicsLabels: ['New articles', 'Strength training and exercises', 'Workout programs', 'Nutrition, calories and macros', 'Supplements', 'Machines and equipment', 'Tools and calculators', 'Practical guides'],
    goalsLabels: ['Muscle gain / hypertrophy', 'Fat loss / cutting', 'Strength', 'General fitness'],
    frequencyLabels: ['Whenever new content matching my preferences is published', 'Once a week', 'Once a month']
  };

  const load = async () => {
    setLoadError(null);
    if (token !== undefined && !token.trim()) {
      setLoadError(copy.invalid);
      return;
    }
    try {
      const data = token ? await getNewsletterPreferences(token, locale) : await userApi.newsletterSettings();
      setVerification(false);
      setPreferences(data);
      setUnsubscribed(Boolean(data.unsubscribed));
    } catch (error) {
      if(error instanceof UserApiError && error.code==='EMAIL_VERIFICATION_REQUIRED'){setVerification(true);return;}
      setLoadError(error instanceof UserApiError ? (locale==='fr'?'Vérifiez votre connexion et réessayez.':'Check your connection and try again.') : error instanceof Error && error.message ? error.message : copy.invalid);
    }
  };
  useEffect(() => { void load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTopic = (topic: NewsletterTopic) => {
    setPreferences((current) => current ? {
      ...current,
      topics: { ...current.topics, [topic]: !current.topics[topic] }
    } : current);
  };

  const toggleGoal = (goal: NewsletterGoal) => {
    setPreferences((current) => current ? {
      ...current,
      goals: current.goals.includes(goal)
        ? current.goals.filter((item) => item !== goal)
        : [...current.goals, goal]
    } : current);
  };

  const save = async () => {
    if (!preferences) return;
    setStatus({ type: 'saving', message: copy.saving });
    try { if(token) await updateNewsletterPreferences(token, preferences, locale); else {await userApi.saveNewsletter({...preferences,language:locale},reactivating);setUnsubscribed(false);setReactivating(false);} setStatus({ type: 'success', message: copy.saved }); }
    catch (error) { setStatus({ type: 'error', message: error instanceof UserApiError && error.code==='NEWSLETTER_UNAVAILABLE' ? (locale==='fr'?'Cet abonnement est indisponible. Contactez-nous.':'This subscription is unavailable. Please contact us.') : copy.saveError }); }
  };

  const unsubscribe = async () => {
    setStatus({ type: 'saving', message: copy.saving });
    try { if(token)await unsubscribeFromNewsletter(token, locale);else await userApi.unsubscribeNewsletter(); setUnsubscribed(true); setConfirmingUnsubscribe(false); setStatus({ type: 'success', message: copy.unsubscribed }); }
    catch (error) { setStatus({ type: 'error', message: locale === 'fr' ? 'Désinscription impossible. Réessayez.' : 'Could not unsubscribe. Please try again.' }); }
  };

  if (verification) return <div className="space-y-4"><p>{locale==='fr'?'Connectez-vous par email une fois pour retrouver votre ancien abonnement dans ce compte.':'Sign in by email once to link your existing subscription to this account.'}</p><VerificationLink locale={locale} /></div>;
  if (loadError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900" role="alert"><p className="font-semibold">{copy.invalid}</p><p className="mt-2 text-sm">{loadError}</p><button onClick={() => void load()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{copy.retry}</button></div>;
  if (!preferences) return <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600" aria-live="polite">{copy.loading}</p>;
  if (unsubscribed && !reactivating) return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900" role="status">{status?.message || copy.unsubscribedExisting}{!token && <button className="ml-4 underline" onClick={()=>{setReactivating(true);setStatus(null);}}>{locale==='fr'?'Réactiver mes abonnements':'Reactivate subscriptions'}</button>}</div>;

  const optionClass = 'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-brand-300 has-[:checked]:border-brand-600 has-[:checked]:bg-blue-50';
  return <div className="space-y-8">
    {!requestUnsubscribe && <><fieldset disabled={status?.type==='saving'}><legend className="text-xl font-bold text-slate-900">{copy.topics}</legend><div className="mt-4 grid gap-3 sm:grid-cols-2">{NEWSLETTER_TOPICS.map((item, i) => <label className={optionClass} key={item}><input type="checkbox" checked={preferences.topics[item]} onChange={() => toggleTopic(item)} className="h-5 w-5 shrink-0 accent-brand-700" /><span>{copy.topicsLabels[i]}</span></label>)}</div></fieldset>
    <fieldset disabled={status?.type === 'saving'}><legend className="text-xl font-bold text-slate-900">{copy.goals}</legend><div className="mt-4 grid gap-3 sm:grid-cols-2">{NEWSLETTER_GOALS.map((item, i) => <label className={optionClass} key={item}><input type="checkbox" checked={preferences.goals.includes(item)} onChange={() => toggleGoal(item)} className="h-5 w-5 shrink-0 accent-brand-700" /><span>{copy.goalsLabels[i]}</span></label>)}</div></fieldset>
    <fieldset disabled={status?.type === 'saving'}><legend className="text-xl font-bold text-slate-900">{copy.frequency}</legend><div className="mt-4 space-y-3">{NEWSLETTER_FREQUENCIES.map((item, i) => <label className={optionClass} key={item}><input type="radio" name="frequency" checked={preferences.frequency === item} onChange={() => setPreferences({ ...preferences, frequency: item as NewsletterFrequency })} className="h-5 w-5 shrink-0 accent-brand-700" /><span>{copy.frequencyLabels[i]}</span></label>)}</div></fieldset>
    {(!preferences.subscribed || reactivating) && <p className="text-sm text-slate-600">{locale==='fr'?'En enregistrant ces choix, vous demandez à recevoir les emails sélectionnés. Vous pourrez vous désinscrire à tout moment.':'By saving these choices, you request the selected emails. You can unsubscribe at any time.'}</p>}
    <div><button type="button" onClick={() => void save()} disabled={status?.type === 'saving'} className="w-full rounded-lg bg-brand-700 px-6 py-3 font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60 sm:w-auto">{status?.type === 'saving' ? copy.saving : copy.save}</button>{status ? <p className={`mt-3 text-sm font-medium ${status.type === 'error' ? 'text-red-700' : status.type === 'success' ? 'text-emerald-700' : 'text-slate-600'}`} role="status">{status.message}</p> : null}</div>
    </>}
    <section className="border-t border-slate-200 pt-7"><h2 className="font-semibold text-slate-900">{copy.unsubscribe}</h2><p className="mt-1 text-sm text-slate-600">{copy.unsubscribeText}</p>{confirmingUnsubscribe ? <div className="mt-4 flex flex-col gap-3 sm:flex-row"><button onClick={() => void unsubscribe()} disabled={status?.type === 'saving'} className="rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">{copy.confirm}</button><button onClick={() => setConfirmingUnsubscribe(false)} disabled={status?.type === 'saving'} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">{copy.cancel}</button></div> : <button disabled={status?.type === 'saving'} onClick={() => setConfirmingUnsubscribe(true)} className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-4">{copy.unsubscribe}</button>}</section>
  </div>;
}

function VerificationLink({locale}:{locale:Locale}) {
  const [sent,setSent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false);
  async function send(){setBusy(true);setError(false);try{const user=await userApi.me();await userApi.requestLoginLink(user.email,locale);setSent(true);}catch{setError(true);}finally{setBusy(false);}}
  return <>{sent?<p role="status">{locale==='fr'?'Un lien de connexion vous a été envoyé.':'A sign-in link has been sent.'}</p>:<button disabled={busy} className="underline" onClick={()=>void send()}>{locale==='fr'?'Recevoir mon lien':'Send sign-in link'}</button>}{error&&<p role="alert">{locale==='fr'?'Envoi impossible. Réessayez dans un instant.':'Unable to send. Please try again shortly.'}</p>}</>;
}
