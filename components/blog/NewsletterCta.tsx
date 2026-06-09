'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { subscribeToNewsletter } from '@/lib/newsletter';

interface NewsletterCtaProps {
  source?: string;
}

export function NewsletterCta({ source = 'home' }: NewsletterCtaProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setSuccessMessage(null);
      setErrorMessage('Veuillez saisir une adresse e-mail.');
      return;
    }

    if (!event.currentTarget.checkValidity()) {
      setSuccessMessage(null);
      setErrorMessage('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = await subscribeToNewsletter(normalizedEmail, source);

      if (payload.data?.alreadySubscribed) {
        setSuccessMessage('Cette adresse est déjà inscrite à la newsletter.');
      } else {
        setSuccessMessage(payload.message || 'Inscription newsletter reçue.');
      }

      setEmail('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erreur pendant l’inscription newsletter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl bg-brand-700 px-6 py-10 text-white">
      <h2 className="text-2xl font-bold">Newsletter The Muscle Temple</h2>
      <p className="mt-2 max-w-2xl text-sm text-blue-100">
        Recevez un résumé hebdomadaire des meilleurs contenus entraînement, nutrition et récupération.
      </p>
      <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor="newsletter-email">
          Adresse e-mail
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          placeholder="Votre email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-blue-300 bg-white/95 px-4 py-3 text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Inscription…' : 'S’inscrire'}
        </button>
      </form>
      <div className="mt-3 text-sm" aria-live="polite">
        {successMessage ? <p className="text-blue-50">{successMessage}</p> : null}
        {errorMessage ? <p className="font-medium text-red-100">{errorMessage}</p> : null}
      </div>
    </section>
  );
}
