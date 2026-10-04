'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useUserSession } from '@/components/user/UserSessionProvider';
import { nutritionApi, UserApiError } from '@/lib/user/api-client';
import type { MealType } from '@/lib/user/types';
import { getFoodByBarcode, searchFoods } from '@/lib/nutrition/api';
import { classifyUniversalSearch } from '@/lib/nutrition/barcode';
import { scaleNutrients } from '@/lib/nutrition/calculations';
import { NutritionApiError, type FoodProduct, type FoodSummary, type NutrientValues } from '@/lib/nutrition/types';
import { PhotoBarcodeInput } from './PhotoBarcodeInput';

const BarcodeScanner = dynamic(() => import('./BarcodeScanner').then((module) => module.BarcodeScanner), { ssr: false });

const fieldClass = 'mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200';
const primaryButton = 'inline-flex min-h-11 items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-brand-50';

const nutrientLabels = {
  fr: [['caloriesKcal', 'Calories', 'kcal'], ['proteinG', 'Protéines', 'g'], ['carbohydratesG', 'Glucides', 'g'], ['fatG', 'Lipides', 'g'], ['sugarsG', 'Sucres', 'g'], ['fiberG', 'Fibres', 'g'], ['saturatedFatG', 'Graisses saturées', 'g'], ['saltG', 'Sel', 'g']],
  en: [['caloriesKcal', 'Calories', 'kcal'], ['proteinG', 'Protein', 'g'], ['carbohydratesG', 'Carbs', 'g'], ['fatG', 'Fat', 'g'], ['sugarsG', 'Sugars', 'g'], ['fiberG', 'Fiber', 'g'], ['saturatedFatG', 'Saturated fat', 'g'], ['saltG', 'Salt', 'g']]
} satisfies Record<'en' | 'fr', Array<[keyof NutrientValues, string, string]>>;

const formatValue = (value: number | null, unit: string, locale: 'en' | 'fr') => value == null ? '—' : `${new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 4 }).format(value)} ${unit}`;

function errorMessage(error: unknown, locale: 'en' | 'fr') {
  const english = locale === 'en';
  const code = error instanceof NutritionApiError ? error.code : 'NETWORK_ERROR';
  if (code === 'PRODUCT_NOT_FOUND') return english ? 'This product was not found in the database.' : 'Ce produit n’a pas été trouvé dans la base.';
  if (code === 'INVALID_BARCODE') return english ? 'This barcode is invalid. Check it and try again.' : 'Ce code-barres n’est pas valide. Vérifiez-le puis réessayez.';
  if (code === 'PROVIDER_UNAVAILABLE') return english ? 'Nutrition data is temporarily unavailable. Please try again later.' : 'Les données nutritionnelles sont temporairement indisponibles. Veuillez réessayer plus tard.';
  return english ? 'The request could not be completed. Check your connection and try again.' : 'La recherche n’a pas pu aboutir. Vérifiez votre connexion puis réessayez.';
}

function NutrientGrid({ values, locale }: { values: NutrientValues; locale: 'en' | 'fr' }) {
  return <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{nutrientLabels[locale].map(([key, label, unit], index) => (
    <div key={key} className={`rounded-xl bg-white p-4 ${index < 4 ? 'ring-1 ring-slate-200' : ''}`}>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-xl font-bold text-slate-950">{formatValue(values[key], unit, locale)}</dd>
    </div>
  ))}</dl>;
}

const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };

export function FoodNutritionTool({ locale = 'fr', diaryContext, initialMode = 'search', onAdded, onCreateCustom }: { locale?: 'en' | 'fr'; diaryContext?: { date: string; mealType: MealType }; initialMode?: 'search' | 'scan'; onAdded?: () => void | Promise<void>; onCreateCustom?: () => void }) {
  const english = locale === 'en';
  const pathname = usePathname();
  const { status } = useUserSession();
  const [query, setQuery] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState<'product' | 'search' | null>(null);
  const [error, setError] = useState('');
  const [detectedCode, setDetectedCode] = useState('');
  const [results, setResults] = useState<FoodSummary[] | null>(null);
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [diaryDate, setDiaryDate] = useState(diaryContext?.date ?? today());
  const [mealType, setMealType] = useState<MealType>(diaryContext?.mealType ?? 'LUNCH');
  const [addStatus, setAddStatus] = useState<'idle' | 'adding' | 'added' | 'incomplete' | 'error'>('idle');
  const controllerRef = useRef<AbortController | null>(null);
  const scanButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => { if (initialMode === 'scan') setScannerOpen(true); }, [initialMode]);

  const loadProduct = async (rawBarcode: string) => {
    const cleanBarcode = rawBarcode.replace(/\s+/g, '');
    if (!cleanBarcode) { setError(english ? 'Enter a barcode.' : 'Saisissez un code-barres.'); return; }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading('product'); setError(''); setProduct(null); setResults(null); setDetectedCode(cleanBarcode);
    try {
      const nextProduct = await getFoodByBarcode(cleanBarcode, controller.signal);
      setProduct(nextProduct);
      setQuantity(100);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(errorMessage(requestError, locale));
    } finally {
      if (controllerRef.current === controller) setLoading(null);
    }
  };

  const runTextSearch = async (cleanQuery: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading('search'); setError(''); setProduct(null); setResults(null);
    try {
      const response = await searchFoods(cleanQuery, controller.signal);
      setResults(response);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(errorMessage(requestError, locale));
    } finally {
      if (controllerRef.current === controller) setLoading(null);
    }
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const input = classifyUniversalSearch(query);
    if (input.kind === 'empty') {
      setError(english ? 'Enter a food name or barcode.' : 'Saisissez un nom d’aliment ou un code-barres.');
    } else if (input.kind === 'invalid-barcode') {
      setError(english ? 'This barcode is invalid. Enter a valid EAN-13, EAN-8, UPC-A, or UPC-E.' : 'Ce code-barres n’est pas valide. Saisissez un code EAN-13, EAN-8, UPC-A ou UPC-E valide.');
    } else if (input.kind === 'barcode') {
      setQuery(input.value);
      void loadProduct(input.value);
    } else {
      void runTextSearch(input.value);
    }
  };

  const closeScanner = () => { setScannerOpen(false); requestAnimationFrame(() => scanButtonRef.current?.focus()); };
  const scanDetected = (code: string) => { setScannerOpen(false); setQuery(code); void loadProduct(code); };
  const unit = product?.nutritionBasis?.unit ?? 'g';
  const basisAmount = product?.nutritionBasis?.amount ?? 100;
  const portion = useMemo(() => product?.nutrition ? scaleNutrients(product.nutrition, Number.isFinite(quantity) ? quantity : 0, basisAmount) : null, [basisAmount, product, quantity]);
  const mealLabels: Record<MealType, string> = english ? { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', SNACK: 'Snack', DINNER: 'Dinner' } : { BREAKFAST: 'Petit-déjeuner', LUNCH: 'Déjeuner', SNACK: 'Collation', DINNER: 'Dîner' };
  const addToDiary = async () => {
    if (!product || !Number.isFinite(quantity) || quantity <= 0) return;
    setAddStatus('adding');
    try {
      await nutritionApi.createEntry({ date: diaryDate, mealType, sourceType: 'OPEN_FOOD_FACTS', barcode: product.barcode, consumedAmount: quantity });
      setAddStatus('added'); await onAdded?.();
    } catch (cause) {
      if (cause instanceof UserApiError && cause.status === 422 && (cause.code === 'INCOMPLETE_NUTRITION_DATA' || cause.message.includes('INCOMPLETE_NUTRITION_DATA'))) setAddStatus('incomplete');
      else setAddStatus('error');
    }
  };

  return (
    <section className="my-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8" aria-labelledby="food-tool-title">
      <h2 id="food-tool-title" className="text-2xl font-bold tracking-tight text-slate-950">{english ? 'Find a food' : 'Trouver un aliment'}</h2>
      <p className="mt-2 text-slate-600">{english ? 'Scan a product, search by name, or enter its barcode.' : 'Scannez un produit, recherchez son nom ou utilisez son code-barres.'}</p>

      <form onSubmit={submitSearch} className="mt-6 rounded-2xl border border-slate-200 p-5" role="search">
        <label htmlFor="food-search" className="text-sm font-semibold text-slate-800">{english ? 'Food or barcode' : 'Aliment ou code-barres'}</label>
        <div className="sm:flex sm:items-end sm:gap-3">
          <input id="food-search" type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={english ? 'Search for a food or enter a barcode' : 'Rechercher un aliment ou saisir un code-barres'} className={fieldClass} />
          <button type="submit" disabled={loading !== null} className={`${primaryButton} mt-3 w-full sm:w-auto`}>{loading ? (english ? 'Searching…' : 'Recherche…') : (english ? 'Search' : 'Rechercher')}</button>
        </div>
      </form>

      <div className="mt-5 rounded-2xl bg-brand-50 p-4 sm:p-5">
        <button ref={scanButtonRef} type="button" onClick={() => { setError(''); setScannerOpen(true); }} disabled={scannerOpen} className={`${primaryButton} w-full py-3 text-base sm:w-auto`}>
          <span aria-hidden="true" className="mr-2 text-lg">▣</span> {english ? 'Scan a barcode' : 'Scanner un code-barres'}
        </button>
        <p className="mt-2 text-xs text-slate-600">{english ? 'The camera is only activated after you click.' : 'La caméra est activée uniquement après votre clic.'}</p>
      </div>
      {scannerOpen ? <div className="mt-4"><BarcodeScanner onDetected={scanDetected} onClose={closeScanner} locale={locale} /></div> : null}

      <div className="mt-5 rounded-2xl border border-slate-200 p-5"><PhotoBarcodeInput locale={locale} disabled={loading !== null} onDetected={(code) => { setQuery(code); void loadProduct(code); }} /></div>

      <div className="mt-6 min-h-12" aria-live="polite" aria-busy={loading !== null}>
        {loading ? <p className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-700" aria-hidden="true" />{loading === 'search' ? (english ? 'Searching for products…' : 'Recherche des produits…') : (english ? `Looking up product${detectedCode ? ` ${detectedCode}` : ''}…` : `Recherche du produit${detectedCode ? ` ${detectedCode}` : ''}…`)}</p> : null}
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert"><p className="font-semibold">{error}</p><p className="mt-2">{english ? 'Try another barcode, scan another product, or search by name.' : 'Essayez un autre code-barres, scannez un autre produit ou recherchez-le par nom.'}</p></div> : null}
      </div>

      {results ? <section className="mt-4" aria-labelledby="results-title">
        <h3 id="results-title" className="text-xl font-bold text-slate-950">{english ? 'Results' : 'Résultats'} ({results.length})</h3>
        {results.length === 0 ? <p className="mt-3 rounded-xl bg-slate-50 p-4 text-slate-700">{english ? 'No products found. Try a more specific name or a brand.' : 'Aucun produit trouvé. Essayez avec un nom plus précis ou une marque.'}</p> : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">{results.map((item) => <li key={item.barcode}>
            <button type="button" onClick={() => void loadProduct(item.barcode)} className="flex min-h-24 w-full items-center gap-4 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-4 focus:ring-brand-50">
              {item.image ? <Image src={item.image} alt="" width={80} height={80} unoptimized className="h-20 w-20 shrink-0 rounded-xl bg-slate-100 object-contain" /> : <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">{english ? 'No image' : 'Sans image'}</span>}
              <span><strong className="block text-slate-950">{item.name || (english ? 'Name unavailable' : 'Nom non renseigné')}</strong>{item.brand ? <span className="mt-1 block text-sm text-slate-600">{item.brand}</span> : null}{item.quantityLabel ? <span className="block text-sm text-slate-500">{item.quantityLabel}</span> : null}</span>
            </button>
          </li>)}</ul>
        )}
      </section> : null}

      {product ? <section className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6" aria-labelledby="product-title">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {product.image ? <Image src={product.image} alt={english ? `Product ${product.name || product.barcode}` : `Produit ${product.name || product.barcode}`} width={144} height={144} unoptimized className="h-36 w-36 rounded-2xl bg-white object-contain" /> : <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white text-sm text-slate-500">{english ? 'Image unavailable' : 'Image indisponible'}</div>}
          <div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">{english ? 'Product found' : 'Produit trouvé'}</p><h3 id="product-title" className="mt-2 text-2xl font-bold text-slate-950">{product.name || (english ? 'Name unavailable' : 'Nom non renseigné')}</h3>{product.brand ? <p className="mt-1 text-slate-700">{product.brand}</p> : null}{product.quantityLabel ? <p className="text-sm text-slate-500">{product.quantityLabel}</p> : null}</div>
        </div>
        {!product.nutritionAvailable || !product.nutrition || !product.nutritionBasis ? <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-medium text-amber-950">{english ? 'Nutrition information is unavailable for this product.' : 'Les informations nutritionnelles de ce produit ne sont pas disponibles.'}</p> : <>
          <div className="mt-7"><h4 className="mb-4 text-lg font-bold text-slate-950">{english ? 'Per' : 'Pour'} {basisAmount} {unit}</h4><NutrientGrid values={product.nutrition} locale={locale} /></div>
          <div className="mt-7 max-w-sm"><label htmlFor="food-quantity" className="text-sm font-semibold text-slate-800">{english ? 'Amount consumed' : 'Quantité consommée'}</label><div className="relative"><input id="food-quantity" type="number" min="0.01" max="10000" step="any" value={quantity} onChange={(event) => setQuantity(event.target.valueAsNumber)} className={`${fieldClass} pr-14 text-lg font-semibold`} /><span className="pointer-events-none absolute bottom-2.5 right-4 font-semibold text-slate-500">{unit}</span></div></div>
          {portion ? <div className="mt-7 rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5"><h4 className="mb-4 text-lg font-bold text-slate-950">{english ? 'For your serving of' : 'Pour votre portion de'} {Number.isFinite(quantity) ? quantity : 0} {unit}</h4><NutrientGrid values={portion} locale={locale} /></div> : null}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
            {status === 'authenticated' ? <>
              <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">{english ? 'Date' : 'Date'}<input type="date" value={diaryDate} onChange={(event) => setDiaryDate(event.target.value)} className={fieldClass} /></label><label className="text-sm font-semibold">{english ? 'Meal' : 'Repas'}<select value={mealType} onChange={(event) => setMealType(event.target.value as MealType)} className={fieldClass}>{Object.entries(mealLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
              <button type="button" disabled={addStatus === 'adding' || !Number.isFinite(quantity) || quantity <= 0} onClick={() => void addToDiary()} className={`${primaryButton} mt-4`}>{addStatus === 'adding' ? '…' : english ? 'Add to my diary' : 'Ajouter à mon journal'}</button>
            </> : <div><p className="font-semibold text-slate-800">{english ? 'Log in to add this food to your tracker.' : 'Connectez-vous pour ajouter cet aliment à votre suivi.'}</p><Link href={`${english ? '/login' : '/fr/connexion'}?returnTo=${encodeURIComponent(pathname)}`} className={`${primaryButton} mt-3`}>{english ? 'Log in' : 'Se connecter'}</Link></div>}
            <div aria-live="polite" className="mt-3 text-sm">{addStatus === 'added' ? <p className="font-semibold text-emerald-700">{english ? 'Food added to your diary.' : 'Aliment ajouté à votre journal.'}</p> : addStatus === 'incomplete' ? <div role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-950"><p>{english ? "This product has incomplete nutrition information and can't be added automatically to your diary." : 'Les informations nutritionnelles de ce produit sont incomplètes et il ne peut pas être ajouté automatiquement au journal.'}</p>{onCreateCustom ? <button type="button" onClick={onCreateCustom} className="mt-2 font-bold underline">{english ? 'Create custom food' : 'Créer un aliment manuellement'}</button> : <Link className="mt-2 inline-block font-bold underline" href={english ? '/nutrition-tracker' : '/fr/suivi-nutrition'}>{english ? 'Create custom food' : 'Créer un aliment manuellement'}</Link>}</div> : addStatus === 'error' ? <p role="alert" className="font-semibold text-red-700">{english ? 'Unable to add this food. Please try again.' : 'Impossible d’ajouter cet aliment. Réessayez.'}</p> : null}</div>
          </div>
        </>}
      </section> : null}

      <p className="mt-6 text-xs leading-5 text-slate-500">{english ? 'Product data provided by ' : 'Données produits fournies par '}<a href="https://world.openfoodfacts.org/" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">Open Food Facts</a>{english ? ', a collaborative database whose records may be incomplete. This information is not medical advice.' : ', une base collaborative dont certaines fiches peuvent être incomplètes. Ces informations ne constituent pas un avis médical.'}</p>
    </section>
  );
}
