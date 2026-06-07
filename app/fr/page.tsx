import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Body Training Guide | Guides musculation',
  description: 'Guides de musculation, nutrition et récupération pour progresser durablement.',
  path: '/fr',
  locale: 'fr',
  hreflang: [
    { hreflang: 'en', href: 'https://bodytrainingguide.com/' },
    { hreflang: 'fr', href: 'https://bodytrainingguide.com/fr' },
    { hreflang: 'x-default', href: 'https://bodytrainingguide.com/' }
  ]
});

export default function FrenchHomePage() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-16">
      <Container>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Body Training Guide</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Construisez un physique fort avec une méthode claire.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-slate-600">
          Retrouvez uniquement les contenus français disponibles : entraînement, nutrition et récupération sans fausse traduction.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/fr/articles" className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Voir les articles français
          </Link>
          <Link href="/" className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">
            English
          </Link>
        </div>
      </Container>
    </section>
  );
}
