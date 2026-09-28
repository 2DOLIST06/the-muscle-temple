import type { Metadata } from 'next';
import { NewsletterPreferencesPage } from '@/components/newsletter/NewsletterPreferencesPage';

export const metadata: Metadata = { title: 'Préférences newsletter', robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string; action?: string }> }) {
  const { token = '', action } = await searchParams;
  return <NewsletterPreferencesPage token={token} locale="fr" requestUnsubscribe={action === 'unsubscribe'} />;
}
