import type { Metadata } from 'next';
import { MacroCalculator } from '@/components/calculators/MacroCalculator';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

const pageDescription = 'Estimate calories, protein, carbs and fats for strength training based on your body data, activity level and goal.';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: 'Macro Calculator for Strength Training | Body Training Guide',
    description: pageDescription,
    path: '/macro-calculator',
    canonicalUrl: 'https://www.bodytrainingguide.com/macro-calculator',
    locale: 'en',
    keywords: ['macro calculator', 'strength training macros', 'calorie calculator', 'protein carbs fats']
  });
}

export default function MacroCalculatorPage() {
  return (
    <Container>
      <main className="py-10">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Macro calculator', href: '/macro-calculator' }]} />
        <section className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Free tool</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Macro Calculator for Strength Training</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">Estimate your daily calories and macro split for maintenance, lean muscle gain, bulking or cutting.</p>
        </section>
        <div id="calculator" className="scroll-mt-24"><MacroCalculator locale="en" headingLevel="h2" /></div>
      </main>
    </Container>
  );
}
