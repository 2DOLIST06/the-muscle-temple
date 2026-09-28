import type { Locale } from '@/lib/i18n/routing';
import { buildPublicApiUrl } from '@/lib/api/env';

export const NEWSLETTER_TOPICS = [
  'new_articles',
  'strength_training',
  'workout_programs',
  'nutrition',
  'supplements',
  'equipment',
  'tools',
  'guides'
] as const;

export const NEWSLETTER_GOALS = ['hypertrophy', 'fat_loss', 'strength', 'general_fitness'] as const;
export const NEWSLETTER_FREQUENCIES = ['immediate', 'weekly', 'monthly'] as const;

export type NewsletterTopic = (typeof NEWSLETTER_TOPICS)[number];
export type NewsletterGoal = (typeof NEWSLETTER_GOALS)[number];
export type NewsletterFrequency = (typeof NEWSLETTER_FREQUENCIES)[number];

export interface NewsletterPreferences {
  topics: NewsletterTopic[];
  goals: NewsletterGoal[];
  frequency: NewsletterFrequency;
  unsubscribed?: boolean;
}

export interface NewsletterSubscriptionResponse {
  message: string;
  preferences_token?: string;
  data?: {
    id?: string;
    email?: string;
    alreadySubscribed?: boolean;
    preferences_token?: string;
  };
}

export const getPreferencesToken = (payload: NewsletterSubscriptionResponse) =>
  payload.preferences_token ?? payload.data?.preferences_token;

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(fallback);
  return payload as T;
}

async function requestNewsletter(url: string, fallback: string, init?: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(fallback);
  }
}

export async function subscribeToNewsletter(
  email: string,
  language: Locale,
  source: string,
  consent: boolean
): Promise<NewsletterSubscriptionResponse> {
  const fallback = language === 'fr'
    ? 'L’inscription est momentanément indisponible. Vérifiez votre connexion et réessayez.'
    : 'Newsletter signup is temporarily unavailable. Check your connection and try again.';
  const response = await requestNewsletter(buildPublicApiUrl('/api/newsletter/subscribe'), fallback, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      language,
      source,
      consent,
      consentTextVersion: 'v1'
    })
  });

  return parseResponse(
    response,
    fallback
  );
}

export async function getNewsletterPreferences(token: string, locale: Locale): Promise<NewsletterPreferences> {
  const fallback = locale === 'fr'
    ? 'Impossible de charger ces préférences. Le lien est peut-être invalide, expiré ou désabonné.'
    : 'Could not load these preferences. The link may be invalid, expired, or unsubscribed.';
  const response = await requestNewsletter(buildPublicApiUrl(`/api/newsletter/preferences?token=${encodeURIComponent(token)}`), fallback, { cache: 'no-store' });
  const payload = await parseResponse<NewsletterPreferences | { data: NewsletterPreferences }>(
    response,
    fallback
  );
  return 'data' in payload ? payload.data : payload;
}

export async function updateNewsletterPreferences(token: string, preferences: NewsletterPreferences, locale: Locale) {
  const fallback = locale === 'fr' ? 'Enregistrement impossible. Vérifiez votre connexion ou votre lien.' : 'Could not save preferences. Check your connection or link.';
  const response = await requestNewsletter(buildPublicApiUrl('/api/newsletter/preferences'), fallback, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...preferences })
  });
  return parseResponse<{ message?: string }>(response, fallback);
}

export async function unsubscribeFromNewsletter(token: string, locale: Locale) {
  const fallback = locale === 'fr' ? 'Désinscription impossible. Vérifiez votre connexion ou votre lien.' : 'Could not unsubscribe. Check your connection or link.';
  const response = await requestNewsletter(buildPublicApiUrl('/api/newsletter/unsubscribe'), fallback, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return parseResponse<{ message?: string }>(response, fallback);
}
