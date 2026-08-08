import Link from 'next/link';
import { getLegalPath, type Locale } from '@/lib/i18n/routing';

export function AffiliateDisclosureNotice({ locale }: { locale: Locale }) {
  return (
    <aside className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950" aria-label={locale === 'fr' ? "Information sur l’affiliation" : 'Affiliate disclosure'}>
      <strong>{locale === 'fr' ? 'Transparence :' : 'Disclosure:'}</strong>{' '}
      {locale === 'fr'
        ? "cette page peut contenir des liens d’affiliation. Si vous effectuez un achat via l’un de ces liens, BodyTrainingGuide peut percevoir une commission, sans coût supplémentaire facturé par BodyTrainingGuide."
        : 'This page may contain affiliate links. If you buy something through one of these links, BodyTrainingGuide may earn a commission at no additional cost to you.'}{' '}
      <Link className="font-semibold underline" href={getLegalPath('affiliate', locale)}>{locale === 'fr' ? 'En savoir plus' : 'Learn more'}</Link>
    </aside>
  );
}
