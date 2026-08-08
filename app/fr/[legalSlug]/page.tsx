import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalDocument, legalDocumentTitles } from '@/components/legal/LegalDocument';
import { absoluteUrl, getLegalPath, legalPaths, type LegalPageKey } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';

const entries = (Object.keys(legalPaths) as LegalPageKey[]).map((pageKey) => ({ pageKey, slug: getLegalPath(pageKey, 'fr').replace('/fr/', '') }));
const getEntry = (slug: string) => entries.find((entry) => entry.slug === slug);
export const dynamicParams = false;
export const generateStaticParams = () => entries.map(({ slug }) => ({ legalSlug: slug }));

export async function generateMetadata({ params }: { params: Promise<{ legalSlug: string }> }): Promise<Metadata> {
  const entry = getEntry((await params).legalSlug);
  if (!entry) return {};
  const enPath = getLegalPath(entry.pageKey, 'en');
  const frPath = getLegalPath(entry.pageKey, 'fr');
  return buildMetadata({
    title: `${legalDocumentTitles.fr[entry.pageKey]} | BodyTrainingGuide`,
    description: `${legalDocumentTitles.fr[entry.pageKey]} de BodyTrainingGuide.`,
    path: frPath,
    locale: 'fr', noIndex: true,
    hreflang: [{ hreflang: 'en', href: absoluteUrl(enPath) }, { hreflang: 'fr', href: absoluteUrl(frPath) }, { hreflang: 'x-default', href: absoluteUrl(enPath) }]
  });
}

export default async function LegalPage({ params }: { params: Promise<{ legalSlug: string }> }) {
  const entry = getEntry((await params).legalSlug);
  if (!entry) return notFound();
  return <LegalDocument locale="fr" pageKey={entry.pageKey} />;
}
