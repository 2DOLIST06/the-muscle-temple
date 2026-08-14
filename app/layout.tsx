import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { AppLayoutBoundary } from './AppLayoutBoundary';
import { siteConfig } from '@/lib/constants';
import { buildMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/lib/i18n/routing';

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} | Strength training guides`,
  description: siteConfig.description,
  path: '/',
  locale: 'en'
});

metadata.manifest = '/site.webmanifest';
export const viewport: Viewport = { themeColor: '#162a63' };

metadata.icons = {
  icon: [{ url: '/logo-BTG.svg', type: 'image/svg+xml' }]
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = ((await headers()).get('x-body-training-guide-locale') === 'fr' ? 'fr' : 'en') satisfies Locale;

  return (
    <html lang={locale}>
      <body>
        <AppLayoutBoundary>{children}</AppLayoutBoundary>
      </body>
    </html>
  );
}
