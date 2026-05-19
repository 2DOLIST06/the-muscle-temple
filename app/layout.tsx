import type { Metadata } from 'next';
import './globals.css';
import { AppLayoutBoundary } from './AppLayoutBoundary';
import { siteConfig } from '@/lib/constants';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} | Blog musculation premium`,
  description: siteConfig.description,
  path: '/'
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <AppLayoutBoundary>{children}</AppLayoutBoundary>
      </body>
    </html>
  );
}
