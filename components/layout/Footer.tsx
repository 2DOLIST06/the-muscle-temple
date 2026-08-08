'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { siteConfig } from '@/lib/constants';
import { getLegalPagePath, getNavigation, getPathLocale } from '@/lib/i18n/routing';

export function Footer() {
  const pathname = usePathname();
  const locale = getPathLocale(pathname ?? '/');
  const navigation = getNavigation(locale);
  const legalNavigation = locale === 'fr'
    ? [
        { label: "Conditions d'utilisation", href: getLegalPagePath('terms', 'fr') },
        { label: 'Avertissement médical', href: getLegalPagePath('medicalDisclaimer', 'fr') },
        { label: 'Affiliation', href: getLegalPagePath('affiliateDisclosure', 'fr') },
        { label: 'Confidentialité', href: getLegalPagePath('privacy', 'fr') },
        { label: 'Cookies', href: getLegalPagePath('cookies', 'fr') },
        { label: 'Mentions légales', href: getLegalPagePath('legal', 'fr') }
      ]
    : [
        { label: 'Terms of Use', href: getLegalPagePath('terms', 'en') },
        { label: 'Medical Disclaimer', href: getLegalPagePath('medicalDisclaimer', 'en') },
        { label: 'Affiliate Disclosure', href: getLegalPagePath('affiliateDisclosure', 'en') },
        { label: 'Privacy Policy', href: getLegalPagePath('privacy', 'en') },
        { label: 'Cookies', href: getLegalPagePath('cookies', 'en') },
        { label: 'Legal Notice', href: getLegalPagePath('legal', 'en') }
      ];

  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <Container>
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="font-semibold text-slate-900">{siteConfig.name}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {locale === 'fr'
                ? 'Guides de musculation, nutrition et récupération pour progresser durablement.'
                : 'Strength training, nutrition and recovery guides for sustainable progress.'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Navigation</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Newsletter</h3>
            <p className="mt-2 text-sm text-slate-600">{locale === 'fr' ? 'Recevez nos contenus sur l’entraînement, la nutrition et la récupération.' : 'Get practical training, nutrition and recovery content.'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{locale === 'fr' ? 'Informations légales' : 'Legal'}</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {legalNavigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}
