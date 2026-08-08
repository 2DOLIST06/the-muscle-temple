'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { siteConfig } from '@/lib/constants';
import { getLegalPath, getNavigation, getPathLocale, type LegalPageKey } from '@/lib/i18n/routing';

export function Footer() {
  const pathname = usePathname();
  const locale = getPathLocale(pathname ?? '/');
  const navigation = getNavigation(locale);
  const legalLinks: Array<{ key: LegalPageKey; label: string }> = locale === 'fr'
    ? [
        { key: 'terms', label: "Conditions d’utilisation" },
        { key: 'medical', label: 'Avertissement médical' },
        { key: 'affiliate', label: 'Affiliation' },
        { key: 'privacy', label: 'Confidentialité' },
        { key: 'cookies', label: 'Cookies' },
        { key: 'legal', label: 'Mentions légales' }
      ]
    : [
        { key: 'terms', label: 'Terms of Use' },
        { key: 'medical', label: 'Medical Disclaimer' },
        { key: 'affiliate', label: 'Affiliate Disclosure' },
        { key: 'privacy', label: 'Privacy Policy' },
        { key: 'cookies', label: 'Cookies' },
        { key: 'legal', label: 'Legal Notice' }
      ];

  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-10">
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-semibold text-slate-900">{locale === 'fr' ? 'Informations légales' : 'Legal'}</h3>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {legalLinks.map((item) => <li key={item.key}><Link href={getLegalPath(item.key, locale)}>{item.label}</Link></li>)}
            </ul>
          </div>
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
        </div>
      </Container>
    </footer>
  );
}
