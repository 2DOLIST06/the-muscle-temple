import { Container } from '@/components/ui/Container';
import { NewsletterPreferencesForm } from '@/components/newsletter/NewsletterPreferencesForm';
import type { Locale } from '@/lib/i18n/routing';

export function NewsletterPreferencesPage({ token, locale }: { token: string; locale: Locale }) {
  return <section className="bg-slate-50 py-12 sm:py-16"><Container><div className="mx-auto max-w-3xl"><div className="mb-8"><p className="text-sm font-bold uppercase tracking-widest text-brand-700">Newsletter</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{locale === 'fr' ? 'Mes préférences' : 'My preferences'}</h1><p className="mt-3 text-slate-600">{locale === 'fr' ? 'Choisissez simplement les contenus et le rythme qui vous conviennent.' : 'Simply choose the content and schedule that suit you.'}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"><NewsletterPreferencesForm token={token} locale={locale} /></div></div></Container></section>;
}
