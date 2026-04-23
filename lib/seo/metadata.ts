import type { Metadata } from 'next';
import { siteConfig } from '@/lib/constants';
import type { SeoInput } from '@/types/seo';

export const buildMetadata = (input: SeoInput): Metadata => {
  const canonical = `${siteConfig.baseUrl}${input.path}`;
  const image = input.image ?? siteConfig.defaultOgImage;

  return {
    metadataBase: new URL(siteConfig.baseUrl),
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical
    },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: input.type ?? 'website',
      url: canonical,
      title: input.title,
      description: input.description,
      siteName: siteConfig.name,
      images: [{ url: image }],
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image]
    }
  };
};
