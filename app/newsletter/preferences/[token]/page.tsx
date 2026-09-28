import type { Metadata } from 'next';
import { NewsletterPreferencesPage } from '@/components/newsletter/NewsletterPreferencesPage';

export const metadata: Metadata = { title: 'Newsletter preferences', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <NewsletterPreferencesPage token={token} locale="en" />;
}
