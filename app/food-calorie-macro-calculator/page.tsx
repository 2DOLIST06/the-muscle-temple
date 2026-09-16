import type { Metadata } from 'next';
import Link from 'next/link';
import { FoodNutritionTool } from '@/components/nutrition/FoodNutritionTool';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

const pagePath = '/food-calorie-macro-calculator';
const frenchPath = '/fr/calculateur-calories-macros-aliments';
const pageTitle = 'Food Calorie and Macro Calculator';
const pageDescription = 'Scan a barcode or search for a food, then calculate its calories, protein, carbs, and fat for the amount you actually consumed.';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: `${pageTitle} | Body Training Guide`,
    description: pageDescription,
    path: pagePath,
    canonicalUrl: `https://www.bodytrainingguide.com${pagePath}`,
    locale: 'en',
    hreflang: [
      { hreflang: 'en', href: `https://www.bodytrainingguide.com${pagePath}` },
      { hreflang: 'fr', href: `https://www.bodytrainingguide.com${frenchPath}` },
      { hreflang: 'x-default', href: `https://www.bodytrainingguide.com${pagePath}` }
    ],
    keywords: ['food calorie calculator', 'food macro calculator', 'barcode nutrition scanner', 'calculate food macros']
  });
}

const applicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: pageTitle,
  url: `https://www.bodytrainingguide.com${pagePath}`,
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  inLanguage: 'en',
  description: pageDescription,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
};

export default function FoodCalorieMacroCalculatorPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationJsonLd) }} />
    <Container><main className="py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Food calories & macros', href: pagePath }]} />
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div><p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Free nutrition tool</p><h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Food Calorie and Macro Calculator</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Search for a food by name, scan its barcode, or upload a photo. Then enter the amount consumed to instantly calculate its calories and macros.</p></div>
        <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><h2 className="text-base font-bold">Simple and private</h2><ul className="mt-3 list-disc space-y-2 pl-5"><li>The camera only opens when you request it.</li><li>Photos are analyzed on your device.</li><li>Changing the serving amount does not send another request.</li></ul></aside>
      </section>

      <FoodNutritionTool locale="en" />

      <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          <section><h2 className="text-2xl font-bold tracking-tight text-slate-950">Find calories and macros for a food</h2><div className="mt-4 space-y-4 leading-8 text-slate-700"><p>Search for a product by name, enter its EAN or UPC, scan the package with your camera, or upload a photo of its barcode. When searching by name, choose the matching product to view its full nutrition details.</p><p>Unknown values are shown with a dash rather than replaced with zero, which could be misleading.</p></div></section>
          <section><h2 className="text-2xl font-bold tracking-tight text-slate-950">Calculate macros for the amount consumed</h2><div className="mt-4 space-y-4 leading-8 text-slate-700"><p>Nutrition labels generally provide values per 100 g or per 100 ml. This calculator keeps the basis supplied by the product record and scales every value to your selected amount without treating milliliters as grams.</p><p className="rounded-2xl bg-slate-50 p-5 font-semibold text-slate-900">Serving value = value per 100 × amount consumed ÷ 100.</p><p>Results update instantly when you change the amount. For example, a 150 g serving contains 1.5 times each value listed per 100 g.</p></div></section>
          <section><h2 className="text-2xl font-bold tracking-tight text-slate-950">Which nutrition values are available?</h2><p className="mt-4 leading-8 text-slate-700">Depending on the product record, you can view calories, protein, carbs, and fat, as well as sugars, fiber, saturated fat, and salt. Collaborative product records can be incomplete, so only available values are displayed.</p></section>
          <section><h2 className="text-2xl font-bold tracking-tight text-slate-950">Where the data comes from</h2><div className="mt-4 space-y-4 leading-8 text-slate-700"><p>Product information comes from <a href="https://world.openfoodfacts.org/" target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline underline-offset-4">Open Food Facts</a>. This collaborative database can contain incomplete records or information entered by contributors.</p><p>Results are provided for informational purposes. They do not replace the product label or advice from a qualified healthcare professional and are not certified medical data.</p></div></section>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start"><div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><h2 className="text-lg font-bold text-slate-950">Plan your nutrition targets</h2><p className="mt-3 text-sm leading-6 text-slate-600">Want to estimate your daily calorie and macro needs for your training goal first?</p><Link href="/macro-calculator" className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Use the macro calculator</Link><Link href="/categories/nutrition" className="mt-3 block text-sm font-semibold text-brand-700 underline underline-offset-4">Browse nutrition articles</Link></div></aside>
      </section>
    </main></Container>
  </>;
}
