import type { Metadata } from 'next';

import { LegalDocument, legalDocumentTitles } from '@/components/legal/LegalDocument';
import { absoluteUrl, getLegalPath, type LegalPageKey, type Locale } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';

export function createLegalPage(pageKey: LegalPageKey, locale: Locale) {
  const enPath = getLegalPath(pageKey, 'en');
  const frPath = getLegalPath(pageKey, 'fr');
  const title = legalDocumentTitles[locale][pageKey];
  const metadata: Metadata = buildMetadata({
    title: `${title} | BodyTrainingGuide`,
    description: locale === 'fr' ? `${title} de BodyTrainingGuide.` : `${title} for BodyTrainingGuide.`,
    path: getLegalPath(pageKey, locale),
    locale,
    noIndex: true,
    hreflang: [
      { hreflang: 'en', href: absoluteUrl(enPath) },
      { hreflang: 'fr', href: absoluteUrl(frPath) },
      { hreflang: 'x-default', href: absoluteUrl(enPath) }
    ]
  });

  function LegalPage() {
    return <LegalDocument locale={locale} pageKey={pageKey} />;
  }

  return { metadata, LegalPage };
}
