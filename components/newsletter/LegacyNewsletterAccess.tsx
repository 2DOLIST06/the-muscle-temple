'use client';
import Link from 'next/link';
import { useState } from 'react';
import { userApi, UserApiError } from '@/lib/user/api-client';
export function LegacyNewsletterAccess({ token, locale }: { token: string; locale: 'fr' | 'en' }) {
  const fr = locale === 'fr';
  const [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false);
  async function send() {
    setBusy(true);
    setError(false);
    try {
      await userApi.newsletterAccountLink(token, locale);
      setSent(true);
    } catch (cause) {
      if (cause instanceof UserApiError && cause.code === 'LOGIN_LINK_COOLDOWN') setSent(true);
      else setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <p>
        {fr
          ? 'Toutes vos préférences se règlent désormais dans votre compte.'
          : 'All your preferences are now managed in your account.'}
      </p>
      <Link className="underline" href={(fr ? '/fr/mon-compte' : '/account') + '?tab=newsletter'}>
        {fr ? 'Accéder à mon compte' : 'Open my account'}
      </Link>
      {sent ? (
        <p role="status">
          {fr ? 'Un lien de connexion vous a été envoyé.' : 'A sign-in link has been sent.'}
        </p>
      ) : (
        <button
          className="block rounded-xl bg-brand-700 px-5 py-3 font-bold text-white"
          disabled={busy}
          onClick={() => void send()}
        >
          {fr ? 'Recevoir un lien pour accéder à mon compte' : 'Email me a link to my account'}
        </button>
      )}
      {error && (
        <p role="alert">
          {fr
            ? 'Impossible d’envoyer le lien. Connectez-vous avec votre adresse email.'
            : 'Unable to send the link. Sign in using your email address.'}
        </p>
      )}
    </div>
  );
}
