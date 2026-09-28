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

const getErrorMessage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return undefined;
  const candidate = payload as { message?: unknown; error?: unknown; detail?: unknown };
  return [candidate.message, candidate.error, candidate.detail].find(
    (value): value is string => typeof value === 'string' && Boolean(value.trim())
  );
};

async function parseResponse<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getErrorMessage(payload) ?? fallback);
  return payload as T;
}

export async function subscribeToNewsletter(
  email: string,
  language: Locale,
  source: string,
  consent: boolean
): Promise<NewsletterSubscriptionResponse> {
  const response = await fetch(buildPublicApiUrl('/api/newsletter'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), language, source, consent })
  });
  return parseResponse(response, language === 'fr' ? 'Erreur pendant l’inscription newsletter.' : 'Newsletter signup failed.');
}

export async function getNewsletterPreferences(token: string, locale: Locale): Promise<NewsletterPreferences> {
  const response = await fetch(`/api/newsletter/preferences?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
  const payload = await parseResponse<NewsletterPreferences | { data: NewsletterPreferences }>(
    response,
    locale === 'fr' ? 'Préférences indisponibles.' : 'Preferences are unavailable.'
  );
  return 'data' in payload ? payload.data : payload;
}

export async function updateNewsletterPreferences(token: string, preferences: NewsletterPreferences, locale: Locale) {
  const response = await fetch('/api/newsletter/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...preferences })
  });
  return parseResponse<{ message?: string }>(response, locale === 'fr' ? 'Enregistrement impossible.' : 'Could not save preferences.');
}

export async function unsubscribeFromNewsletter(token: string, locale: Locale) {
  const response = await fetch('/api/newsletter/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return parseResponse<{ message?: string }>(response, locale === 'fr' ? 'Désinscription impossible.' : 'Could not unsubscribe.');
}
