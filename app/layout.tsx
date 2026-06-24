import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = ((await headers()).get('x-body-training-guide-locale') === 'fr' ? 'fr' : 'en') satisfies Locale;

  return (
    <html lang={locale}>
      <Script id="google-tag-manager" strategy="beforeInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PGQQXCNN');`}
      </Script>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PGQQXCNN"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <AppLayoutBoundary>{children}</AppLayoutBoundary>
      </body>
    </html>
  );
}
