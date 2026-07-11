import type { Metadata } from 'next';
import Link from 'next/link';
import { MacroCalculator } from '@/components/calculators/MacroCalculator';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

const pageTitle = 'Macro Calculator for Strength Training: Calories, Protein, Carbs and Fat';
const pageDescription = 'Calculate your strength training macros from your body weight, height, age, activity level and goal: maintenance, lean muscle gain, bulking or cutting.';
const pagePath = '/macro-calculator';

const calculatorJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Macro Calculator for Strength Training',
  url: 'https://www.bodytrainingguide.com/macro-calculator',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  inLanguage: 'en',
  description: pageDescription,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do you calculate macros for strength training?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'First estimate maintenance calories, choose a goal, then split calories between protein, fat and carbs. The calculator gives a starting point that should be adjusted based on real progress.'
      }
    },
    {
      '@type': 'Question',
      name: 'How much protein should I eat per day?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For strength training, a common starting range is about 1.6 to 2.2 grams of protein per kilogram of body weight, depending on the goal and individual context.'
      }
    },
    {
      '@type': 'Question',
      name: 'How often should I recalculate my macros?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It is useful to reassess macros after two to four weeks, or after a clear change in body weight, performance, activity level or training goal.'
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
    locale: 'en',
    hreflang: [
      { hreflang: 'en', href: 'https://www.bodytrainingguide.com/macro-calculator' },
      { hreflang: 'fr', href: 'https://www.bodytrainingguide.com/fr/calculateur-macros' },
      { hreflang: 'x-default', href: 'https://www.bodytrainingguide.com/macro-calculator' }
    ],
    keywords: ['macro calculator', 'strength training macros', 'calorie calculator', 'protein carbs fats', 'bulking', 'cutting']
  });
}

export default function MacroCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(calculatorJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Container>
        <main className="py-10">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Macro calculator', href: pagePath }]} />

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Free tool</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Macro Calculator for Strength Training</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                Estimate your calories and your protein, carbs and fat split to build a nutrition plan that matches your goal: lean muscle gain, bulking, maintenance or cutting.
              </p>
            </div>
            <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
              <h2 className="text-base font-bold text-amber-950">Key takeaways</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>The results are starting targets, not medical advice.</li>
                <li>Track your 7-day average body weight before changing calories.</li>
                <li>Reassess your macros after 2 to 4 weeks based on progress.</li>
              </ul>
            </aside>
          </section>

          <div id="calculator" className="scroll-mt-24">
            <MacroCalculator locale="en" headingLevel="h2" />
          </div>

          <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-10">
              <section>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Why calculate macros for strength training?</h2>
                <div className="mt-4 space-y-4 leading-8 text-slate-700">
                  <p>Macros are the macronutrients that provide energy: protein, carbohydrates and fat. In strength training, tracking them helps connect nutrition to recovery, performance and changes in body composition.</p>
                  <p>You do not need gram-perfect accuracy, but a calculated target gives you a reliable structure. You know how much to eat, which nutrients to prioritize and how to adjust your plan if weight or performance stalls.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">How to use the macro calculator</h2>
                <ol className="mt-4 list-decimal space-y-3 pl-6 leading-8 text-slate-700">
                  <li>Enter your sex, age, height and weight to estimate your basal metabolic rate.</li>
                  <li>Choose the activity level that best matches your weekly routine.</li>
                  <li>Select your goal: maintenance, lean muscle gain, bulking or cutting.</li>
                  <li>Use the calories and macros for 2 to 4 weeks, then adjust based on results.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">How to interpret protein, carbs and fat</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-950">Protein</h3><p className="mt-2 text-sm leading-6 text-slate-600">Protein supports muscle growth and maintenance. It is usually the first macro to set in the split.</p></div>
                  <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-950">Carbs</h3><p className="mt-2 text-sm leading-6 text-slate-600">Carbs fill the remaining calories and help support training intensity, especially when training volume is high.</p></div>
                  <div className="rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-slate-950">Fat</h3><p className="mt-2 text-sm leading-6 text-slate-600">Fat should stay high enough for overall balance. Avoid cutting it too aggressively for long periods.</p></div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">Macro calculation FAQ</h2>
                <div className="mt-4 space-y-4">
                  <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-semibold text-slate-950">Are the calculator macros exact?</summary><p className="mt-3 leading-7 text-slate-700">They are an estimate. Your real energy expenditure depends on activity, recovery, NEAT and training progress. Real-world tracking is still essential.</p></details>
                  <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-semibold text-slate-950">Which goal should I choose to build muscle?</summary><p className="mt-3 leading-7 text-slate-700">Lean muscle gain is best if you want to limit fat gain. Bulking is more appropriate if you accept a larger calorie surplus.</p></details>
                  <details className="rounded-2xl border border-slate-200 p-5"><summary className="cursor-pointer font-semibold text-slate-950">Can I use this calculator for cutting?</summary><p className="mt-3 leading-7 text-slate-700">Yes. Choose the cutting goal to get a moderate deficit, then adjust based on body weight, measurements and performance.</p></details>
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-bold text-slate-950">Go deeper</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">To understand the strategy behind the numbers, read the full macro and calorie guide.</p>
                <Link href="https://www.bodytrainingguide.com/articles/calculating-macros-and-calories-for-strength-training" className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Read the macro guide</Link>
              </div>
            </aside>
          </section>
        </main>
      </Container>
    </>
  );
}
