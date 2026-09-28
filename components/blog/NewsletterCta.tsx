'use client';

import Link from 'next/link';
import { useId, useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/i18n/routing';
import { getPreferencesToken, subscribeToNewsletter } from '@/lib/newsletter';

interface NewsletterSignupProps {
  source?: 'footer' | 'article' | 'page' | string;
  locale?: Locale;
  compact?: boolean;
}

export function NewsletterSignup({ source = 'page', locale = 'fr', compact = false }: NewsletterSignupProps) {
  const emailId = useId();
  const consentId = useId();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ message: string; token?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = locale === 'fr' ? {
    title: 'Recevez nos nouveaux contenus',
    text: 'Recevez les nouveaux articles, guides et outils Body Training Guide selon vos centres d’intérêt.',
    label: 'Adresse email', placeholder: 'Adresse email', button: 'S’inscrire', loading: 'Inscription…',
    consent: 'J’accepte de recevoir la newsletter Body Training Guide par email.',
    consentError: 'Veuillez donner votre consentement pour vous inscrire.',
    success: 'Votre inscription a bien été prise en compte.', customize: 'Personnalisez ce que vous souhaitez recevoir.',
    preferences: 'Modifier mes préférences', error: 'L’inscription est momentanément indisponible.'
  } : {
    title: 'Get our latest content',
    text: 'Get new Body Training Guide articles, guides and tools based on your interests.',
    label: 'Email address', placeholder: 'Email address', button: 'Subscribe', loading: 'Subscribing…',
    consent: 'I agree to receive the Body Training Guide newsletter by email.',
    consentError: 'Please provide your consent to subscribe.',
    success: 'Your subscription has been confirmed.', customize: 'Choose what you would like to receive.',
    preferences: 'Edit my preferences', error: 'Newsletter signup is temporarily unavailable.'
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consent) { setError(copy.consentError); return; }
    if (!event.currentTarget.checkValidity()) { event.currentTarget.reportValidity(); return; }
    setIsSubmitting(true); setError(null);
    try {
      const payload = await subscribeToNewsletter(email, locale, source, consent);
      setSuccess({ message: payload.message || copy.success, token: getPreferencesToken(payload) });
      setEmail(''); setConsent(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.error);
    } finally { setIsSubmitting(false); }
  };

  const content = success ? (
    <div className="space-y-3" aria-live="polite">
      <p className="font-semibold">{copy.success}</p>
      <p className={compact ? 'text-sm text-slate-600' : 'text-sm text-blue-100'}>{copy.customize}</p>
      {success.token ? (
        <Link href={`${locale === 'fr' ? '/fr' : ''}/newsletter/preferences/${encodeURIComponent(success.token)}`} className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
          {copy.preferences}
        </Link>
      ) : null}
    </div>
  ) : (
    <>
      <form className="mt-5 space-y-3" onSubmit={submit} noValidate>
        <div className={compact ? 'space-y-3' : 'flex flex-col gap-3 sm:flex-row'}>
          <label className="sr-only" htmlFor={emailId}>{copy.label}</label>
          <input id={emailId} type="email" required placeholder={copy.placeholder} value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} className="min-w-0 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60" />
          <button disabled={isSubmitting} className="shrink-0 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? copy.loading : copy.button}</button>
        </div>
        <label htmlFor={consentId} className="flex cursor-pointer items-start gap-3 text-sm leading-5">
          <input id={consentId} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-700" />
          <span>{copy.consent}</span>
        </label>
      </form>
      {error ? <p className={`mt-3 text-sm font-medium ${compact ? 'text-red-700' : 'text-red-100'}`} role="alert">{error}</p> : null}
    </>
  );

  if (compact) return <div><h3 className="font-semibold text-slate-900">{copy.title}</h3><p className="mt-2 text-sm text-slate-600">{copy.text}</p>{content}</div>;
  return <section className="rounded-2xl bg-brand-700 px-6 py-10 text-white"><h2 className="text-2xl font-bold">{copy.title}</h2><p className="mt-2 max-w-2xl text-sm text-blue-100">{copy.text}</p>{content}</section>;
}

export const NewsletterCta = NewsletterSignup;
