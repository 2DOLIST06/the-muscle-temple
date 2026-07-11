import type { Metadata } from 'next';
import Link from 'next/link';
import { MacroCalculator } from '@/components/calculators/MacroCalculator';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

const pageTitle = 'Calculateur de macros musculation : calories, protéines, glucides et lipides';
const pageDescription = 'Calculez vos macros pour la musculation selon votre poids, taille, âge, activité et objectif : maintien, prise de muscle, prise de masse ou sèche.';
const pagePath = '/fr/calculateur-macros';

const calculatorJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Calculateur de macros musculation',
  url: 'https://www.bodytrainingguide.com/fr/calculateur-macros',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  inLanguage: 'fr',
  description: pageDescription,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment calculer ses macros en musculation ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Il faut d’abord estimer les calories de maintien, choisir un objectif, puis répartir les calories entre protéines, lipides et glucides. Le calculateur propose un point de départ à ajuster selon les résultats.'
      }
    },
    {
      '@type': 'Question',
      name: 'Combien de protéines faut-il prendre par jour ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'En musculation, une base fréquente se situe autour de 1,6 à 2,2 g de protéines par kilo de poids de corps, selon l’objectif et le contexte individuel.'
      }
    },
    {
      '@type': 'Question',
      name: 'Faut-il recalculer ses macros souvent ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Oui, il est utile de réévaluer ses macros après deux à quatre semaines, ou après un changement net de poids, de performance, d’activité ou d’objectif.'
      }
    }
  ]
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: `${pageTitle} | Body Training Guide`,
    description: pageDescription,
    path: pagePath,
    canonicalUrl: `https://www.bodytrainingguide.com${pagePath}`,
    locale: 'fr',
    keywords: ['calculateur macros', 'macro musculation', 'calcul calories musculation', 'protéines glucides lipides', 'prise de masse', 'sèche']
  });
}

export default function FrenchMacroCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Container>
        <main className="py-10">
          <Breadcrumbs items={[{ label: 'Accueil', href: '/fr' }, { label: 'Calculateur de macros', href: pagePath }]} />

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Outil gratuit</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Calculateur de macros musculation</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                Estimez vos calories et votre répartition en protéines, glucides et lipides pour construire un plan nutritionnel cohérent avec votre objectif : prise de muscle progressive, prise de masse, maintien ou sèche.
              </p>
            </div>
            <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <h2 className="text-base font-bold text-amber-950">À retenir</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Les résultats sont des repères de départ, pas une prescription médicale.</li>
                <li>Suivez la moyenne de votre poids sur 7 jours pour ajuster les calories.</li>
                <li>Réévaluez vos macros après 2 à 4 semaines selon vos progrès.</li>
              </ul>
            </aside>
          </section>

          <div id="calculateur" className="scroll-mt-24">
            <MacroCalculator locale="fr" headingLevel="h2" />
          </div>

          <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-10">
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Pourquoi calculer ses macros en musculation&nbsp;?</h2>
                <div className="mt-4 space-y-4 leading-8 text-slate-700">
                  <p>Les macros correspondent aux macronutriments qui fournissent l’énergie : protéines, glucides et lipides. En musculation, les suivre permet de mieux relier l’alimentation à la récupération, aux performances et à l’évolution de la composition corporelle.</p>
                  <p>Un calcul précis n’est pas nécessaire au gramme près, mais il donne une structure fiable. Vous savez combien manger, quels apports prioriser et comment modifier votre plan si votre poids ou vos performances stagnent.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Comment utiliser le calculateur de macros&nbsp;?</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-6 leading-8 text-slate-700">
                  <li>Renseignez votre sexe, âge, taille et poids pour estimer votre métabolisme de base.</li>
                  <li>Choisissez un niveau d’activité proche de votre réalité hebdomadaire.</li>
                  <li>Sélectionnez votre objectif : maintien, prise de muscle progressive, prise de masse ou sèche.</li>
                  <li>Utilisez les calories et les macros obtenues pendant 2 à 4 semaines, puis ajustez selon les résultats.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Interpréter protéines, glucides et lipides</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-950">Protéines</h3><p className="mt-2 text-sm leading-6 text-slate-600">Elles soutiennent la construction et le maintien de la masse musculaire. Elles sont généralement prioritaires dans la répartition.</p></div>
                  <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-950">Glucides</h3><p className="mt-2 text-sm leading-6 text-slate-600">Ils complètent les calories restantes et aident à soutenir l’intensité des séances, surtout avec un volume d’entraînement élevé.</p></div>
                  <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-950">Lipides</h3><p className="mt-2 text-sm leading-6 text-slate-600">Ils doivent rester suffisants pour l’équilibre général. Évitez de les réduire excessivement sur une longue période.</p></div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">FAQ sur le calcul des macros</h2>
                <div className="mt-4 space-y-4">
                  <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-semibold text-slate-950">Les macros du calculateur sont-elles exactes&nbsp;?</summary><p className="mt-3 leading-7 text-slate-700">Elles sont une estimation. Votre dépense réelle dépend de votre activité, de votre récupération, de votre NEAT et de votre progression. Le suivi terrain reste indispensable.</p></details>
                  <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-semibold text-slate-950">Quel objectif choisir pour prendre du muscle&nbsp;?</summary><p className="mt-3 leading-7 text-slate-700">La prise de muscle progressive convient si vous voulez limiter la prise de gras. La prise de masse est plus adaptée si vous acceptez un surplus calorique plus marqué.</p></details>
                  <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-semibold text-slate-950">Peut-on utiliser ce calculateur pour une sèche&nbsp;?</summary><p className="mt-3 leading-7 text-slate-700">Oui. Choisissez l’objectif sèche pour obtenir un déficit modéré, puis ajustez selon l’évolution du poids, des mensurations et des performances.</p></details>
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-bold text-slate-950">Aller plus loin</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">Pour comprendre la stratégie derrière les chiffres, consultez aussi notre guide nutrition.</p>
                <Link href="/fr/articles/nutrition-prise-de-masse-propre" className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Lire le guide nutrition</Link>
              </div>
            </aside>
          </section>
        </main>
      </Container>
    </>
  );
}
