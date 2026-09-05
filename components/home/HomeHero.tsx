import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import type { Locale } from '@/lib/i18n/routing';

const copy = {
  en: {
    eyebrow: 'Science-backed · Made practical', titleStart: 'Train with purpose.', titleAccent: 'Progress with confidence.',
    description: 'Strength training, exercise, nutrition and recovery guides to help you organize your workouts and make steady progress.',
    primary: 'Explore our guides', secondary: 'Browse categories', cardEyebrow: 'The BTG method',
    cardTitle: 'Clear advice for lasting results.', steps: ['Understand', 'Apply', 'Progress'],
    note: 'No shortcuts. Just useful, accessible guidance.'
  },
  fr: {
    eyebrow: 'Fondé sur la science · Pensé pour la pratique', titleStart: 'Entraînez-vous avec méthode.', titleAccent: 'Progressez avec confiance.',
    description: 'Guides de musculation, exercices, nutrition et récupération pour mieux organiser vos entraînements et progresser avec une méthode claire.',
    primary: 'Découvrir nos guides', secondary: 'Voir les catégories', cardEyebrow: 'La méthode BTG',
    cardTitle: 'Des conseils clairs pour des résultats durables.', steps: ['Comprendre', 'Appliquer', 'Progresser'],
    note: 'Pas de raccourci. Des conseils utiles et accessibles.'
  }
};

export function HomeHero({ locale }: { locale: Locale }) {
  const content = copy[locale];
  const articlesHref = locale === 'fr' ? '/fr/articles' : '/articles';

  return (
    <section className="relative isolate overflow-hidden border-b-2 border-slate-300 bg-slate-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_15%,rgba(31,58,138,0.10),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(31,58,138,0.08),transparent_24%)]" />
      <div className="absolute inset-0 -z-10 opacity-40 [background-image:linear-gradient(to_right,rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.12)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <Container>
        <div className="grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-700/25 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-brand-500" />{content.eyebrow}
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              {content.titleStart} <span className="text-brand-700">{content.titleAccent}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{content.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={articlesHref} className="inline-flex items-center justify-center rounded-full bg-brand-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_10px_25px_rgba(22,42,99,0.22)] transition hover:-translate-y-0.5 hover:bg-brand-500 hover:shadow-[0_14px_30px_rgba(22,42,99,0.28)]">
                {content.primary}<span className="ml-2" aria-hidden="true">→</span>
              </Link>
              <Link href="#categories" className="inline-flex items-center justify-center rounded-full border-2 border-slate-300 bg-white px-6 py-3 text-sm font-extrabold text-slate-800 transition hover:border-brand-700 hover:text-brand-700">{content.secondary}</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-lg lg:mx-0">
            <div className="absolute -inset-4 rotate-3 rounded-[2rem] border-2 border-brand-700/15 bg-brand-50" />
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-slate-300 bg-slate-950 p-7 text-white shadow-2xl sm:p-9">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[28px] border-brand-500/25" />
              <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-blue-200">{content.cardEyebrow}</p>
              <p className="relative mt-4 max-w-sm text-2xl font-bold leading-tight sm:text-3xl">{content.cardTitle}</p>
              <ol className="relative mt-10 grid grid-cols-3 gap-2 border-y border-white/20 py-5">
                {content.steps.map((step, index) => (
                  <li key={step} className="border-r border-white/20 px-2 first:pl-0 last:border-0"><span className="block text-xs font-bold text-blue-300">0{index + 1}</span><span className="mt-1 block text-sm font-semibold sm:text-base">{step}</span></li>
                ))}
              </ol>
              <p className="relative mt-5 text-sm leading-6 text-slate-300">{content.note}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
