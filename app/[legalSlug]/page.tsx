import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalDocument, legalDocumentTitles } from '@/components/legal/LegalDocument';
import { absoluteUrl, getLegalPath, legalPaths, type LegalPageKey } from '@/lib/i18n/routing';
import { buildMetadata } from '@/lib/seo/metadata';

const entries = (Object.keys(legalPaths) as LegalPageKey[]).map((pageKey) => ({ pageKey, slug: getLegalPath(pageKey, 'en').slice(1) }));
const getEntry = (slug: string) => entries.find((entry) => entry.slug === slug);
export const dynamicParams = false;
export const generateStaticParams = () => entries.map(({ slug }) => ({ legalSlug: slug }));

export async function generateMetadata({ params }: { params: Promise<{ legalSlug: string }> }): Promise<Metadata> {
  const entry = getEntry((await params).legalSlug);
  if (!entry) return {};
  const enPath = getLegalPath(entry.pageKey, 'en');
  const frPath = getLegalPath(entry.pageKey, 'fr');
  return buildMetadata({
    title: `${legalDocumentTitles.en[entry.pageKey]} | BodyTrainingGuide`,
    description: `${legalDocumentTitles.en[entry.pageKey]} for BodyTrainingGuide.`,
    path: enPath,
    locale: 'en', noIndex: true,
    hreflang: [{ hreflang: 'en', href: absoluteUrl(enPath) }, { hreflang: 'fr', href: absoluteUrl(frPath) }, { hreflang: 'x-default', href: absoluteUrl(enPath) }]
  });
}

export default async function LegalPage({ params }: { params: Promise<{ legalSlug: string }> }) {
  const entry = getEntry((await params).legalSlug);
  if (!entry) return notFound();
  return <LegalDocument locale="en" pageKey={entry.pageKey} />;
}
