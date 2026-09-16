import type { Metadata } from 'next';
import Link from 'next/link';
import { FoodNutritionTool } from '@/components/nutrition/FoodNutritionTool';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { buildMetadata } from '@/lib/seo/metadata';

const pagePath = '/fr/calculateur-calories-macros-aliments';
const pageTitle = 'Calories et macros des aliments : calculateur nutritionnel';
const pageDescription = 'Scannez un code-barres ou recherchez un aliment, puis calculez ses calories, protéines, glucides et lipides selon la quantité consommée.';

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: `${pageTitle} | Body Training Guide`, description: pageDescription, path: pagePath,
    canonicalUrl: `https://www.bodytrainingguide.com${pagePath}`, locale: 'fr',
    keywords: ['calories aliments', 'macros aliments', 'scanner code-barres nutrition', 'calculateur nutritionnel']
  });
}

const applicationJsonLd = {
  '@context': 'https://schema.org', '@type': 'WebApplication', name: pageTitle,
  url: `https://www.bodytrainingguide.com${pagePath}`, applicationCategory: 'HealthApplication',
  operatingSystem: 'Web', inLanguage: 'fr', description: pageDescription,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }
};

export default function FoodNutritionCalculatorPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationJsonLd) }} />
    <Container><main className="py-10">
      <Breadcrumbs items={[{ label: 'Accueil', href: '/fr' }, { label: 'Calories & macros des aliments', href: pagePath }]} />
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div><p className="text-sm font-semibold uppercase tracking-widest text-brand-700">Outil nutrition gratuit</p><h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Calculateur de calories et macros des aliments</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Recherchez un aliment par son nom, scannez son code-barres ou importez une photo. Indiquez ensuite la quantité consommée pour obtenir immédiatement ses calories et macronutriments.</p></div>
        <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><h2 className="text-base font-bold">Simple et confidentiel</h2><ul className="mt-3 list-disc space-y-2 pl-5"><li>La caméra ne s’ouvre qu’à votre demande.</li><li>Les photos sont analysées sur votre appareil.</li><li>Le calcul de portion ne déclenche aucune nouvelle requête.</li></ul></aside>
      </section>

      <FoodNutritionTool />

      <section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-10">
          <section><h2 className="text-2xl font-bold tracking-tight text-slate-950">Rechercher les calories et macros d’un aliment</h2><div className="mt-4 space-y-4 leading-8 text-slate-700"><p>L’outil permet de retrouver un produit par son nom, de saisir son code EAN ou UPC, de scanner directement son emballage avec la caméra ou d’analyser une photo du code-barres. Après une recherche par nom, sélectionnez le bon produit pour consulter sa fiche complète.</p><p>Les valeurs inconnues restent signalées par un tiret : elles ne sont jamais remplacées par un zéro qui pourrait induire en erreur.</p></div></section>
          <section><h2 className="text-2xl font-bold tracking-tight text-slate-950">Calculer les macros selon la quantité consommée</h2><div className="mt-4 space-y-4 leading-8 text-slate-700"><p>Les étiquettes expriment généralement les informations pour 100 g ou pour 100 ml. L’outil conserve la base indiquée par la fiche et adapte chaque valeur à la quantité saisie, sans assimiler les millilitres aux grammes.</p><p className="rounded-2xl bg-slate-50 p-5 font-semibold text-slate-900">Valeur de la portion = valeur pour 100 × quantité consommée ÷ 100.</p><p>Le résultat change instantanément lorsque vous modifiez la quantité. Par exemple, une portion de 150 g correspond à 1,5 fois chaque valeur donnée pour 100 g.</p></div></section>
          <section><h2 className="text-2xl font-bold tracking-tight text-slate-950">Quelles données nutritionnelles sont disponibles&nbsp;?</h2><p className="mt-4 leading-8 text-slate-700">Selon la fiche du produit, vous pouvez consulter les calories, les protéines, les glucides et les lipides, ainsi que les sucres, les fibres, les graisses saturées et le sel. Une fiche collaborative peut être partielle : seules les données effectivement disponibles sont présentées.</p></section>
          <section><h2 className="text-2xl font-bold tracking-tight text-slate-950">Origine des données</h2><div className="mt-4 space-y-4 leading-8 text-slate-700"><p>Les informations produits proviennent d’<a href="https://world.openfoodfacts.org/" target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline underline-offset-4">Open Food Facts</a>. Cette base collaborative peut contenir des fiches incomplètes ou des informations saisies par ses contributeurs.</p><p>Les résultats sont fournis à titre informatif. Ils ne remplacent ni l’étiquette du produit, ni l’avis d’un professionnel de santé, et ne constituent pas des données médicales certifiées.</p></div></section>
        </div>
        <aside className="lg:sticky lg:top-24 lg:self-start"><div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><h2 className="text-lg font-bold text-slate-950">Planifier vos apports</h2><p className="mt-3 text-sm leading-6 text-slate-600">Vous souhaitez d’abord estimer vos besoins journaliers selon votre objectif sportif&nbsp;?</p><Link href="/fr/calculateur-macros" className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Utiliser le calculateur de macros</Link><Link href="/fr/categories/nutrition" className="mt-3 block text-sm font-semibold text-brand-700 underline underline-offset-4">Voir les articles nutrition</Link></div></aside>
      </section>
    </main></Container>
  </>;
}
