import { Container } from '@/components/ui/Container';
import { NewsletterPreferencesForm } from './NewsletterPreferencesForm';
import { LegacyNewsletterAccess } from './LegacyNewsletterAccess';
import type { Locale } from '@/lib/i18n/routing';
export function NewsletterPreferencesPage({token,locale,requestUnsubscribe=false}:{token:string;locale:Locale;requestUnsubscribe?:boolean}) {
  return <main className="py-16"><Container><div className="mx-auto max-w-3xl space-y-6"><h1 className="text-3xl font-bold">{requestUnsubscribe?(locale==='fr'?'Me désabonner':'Unsubscribe'):(locale==='fr'?'Mes préférences newsletter':'My newsletter preferences')}</h1>{requestUnsubscribe?<NewsletterPreferencesForm token={token} locale={locale} requestUnsubscribe />:<LegacyNewsletterAccess token={token} locale={locale} />}</div></Container></main>;
}
