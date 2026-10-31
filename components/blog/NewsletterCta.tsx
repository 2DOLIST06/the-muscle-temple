'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState, type FormEvent } from 'react';
import type { Locale } from '@/lib/i18n/routing';
import { userApi } from '@/lib/user/api-client';
import { useUserSession } from '@/components/user/UserSessionProvider';

export function NewsletterSignup({
  source = 'page',
  locale = 'fr',
  compact = false,
}: {
  source?: string;
  locale?: Locale;
  compact?: boolean;
}) {
  const id = useId(),
    router = useRouter(),
    fr = locale === 'fr';
  const { user, status, completeSignup, setNewsletterEntry } = useUserSession();
  const [email, setEmail] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const account = fr ? '/fr/mon-compte' : '/account',
    login = fr ? '/fr/connexion' : '/login';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await userApi.startNewsletter(email, locale, source);
      if (result.authenticated && result.user) completeSignup(result.user);
      setNewsletterEntry({ email: email.trim().toLowerCase(), existing: result.status === 'existing' });
      router.push(account + '?tab=newsletter');
    } catch {
      setError(
        fr
          ? 'Inscription impossible pour le moment. Réessayez.'
          : 'Unable to subscribe right now. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  const content = user ? (
    <Link
      className="mt-4 inline-block rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white"
      href={account + '?tab=newsletter'}
    >
      {fr ? 'Gérer mes préférences newsletter' : 'Manage newsletter preferences'}
    </Link>
  ) : (
    <>
      <form onSubmit={submit} className="mt-5 space-y-3">
        <label htmlFor={id} className="block font-semibold">
          {fr ? 'Adresse email' : 'Email address'}{' '}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <input
          id={id}
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
        />
        <p className="text-sm">
          {fr
            ? 'En cliquant sur « Valider », vous vous inscrivez à la newsletter Body Training Guide. Vous pourrez choisir vos sujets ou vous désinscrire à tout moment.'
            : 'By clicking Confirm, you subscribe to the Body Training Guide newsletter. You can choose your topics or unsubscribe at any time.'}{' '}
          <Link className="underline" href={fr ? '/fr/confidentialite' : '/privacy'}>
            {fr ? 'Confidentialité' : 'Privacy'}
          </Link>
        </p>
        {error && (
          <p role="alert" className="text-red-800">
            {error}
          </p>
        )}
        <button
          disabled={busy || status === 'loading'}
          className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {busy ? (fr ? 'Inscription…' : 'Subscribing…') : fr ? 'Valider' : 'Confirm'}
        </button>
      </form>
      <p className="mt-4">
        <Link className="underline" href={login}>
          {fr ? 'Déjà un compte ? Se connecter' : 'Already have an account? Sign in'}
        </Link>
      </p>
    </>
  );
  return (
    <section className={compact ? '' : 'rounded-2xl border border-slate-200 bg-white p-6 text-slate-900'}>
      <h2 className="text-xl font-bold">{fr ? 'Recevez nos nouveaux contenus' : 'Get our latest content'}</h2>
      <p className="mt-2 text-sm">
        {fr
          ? 'Articles, programmes, nutrition et outils : choisissez ensuite ce qui vous intéresse dans votre compte.'
          : 'Articles, workouts, nutrition and tools: choose your interests in your account.'}
      </p>
      {content}
    </section>
  );
}
export const NewsletterCta = NewsletterSignup;
