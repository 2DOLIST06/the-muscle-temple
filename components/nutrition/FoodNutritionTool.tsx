'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { getFoodByBarcode, searchFoods } from '@/lib/nutrition/api';
import { scaleNutrients } from '@/lib/nutrition/calculations';
import { NutritionApiError, type FoodProduct, type FoodSummary, type NutrientValues } from '@/lib/nutrition/types';
import { PhotoBarcodeInput } from './PhotoBarcodeInput';

const BarcodeScanner = dynamic(() => import('./BarcodeScanner').then((module) => module.BarcodeScanner), { ssr: false });

const fieldClass = 'mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200';
const primaryButton = 'inline-flex min-h-11 items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-500 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-brand-50';

const nutrientLabels: Array<[keyof NutrientValues, string, string]> = [
  ['calories', 'Calories', 'kcal'], ['proteins', 'Protéines', 'g'], ['carbohydrates', 'Glucides', 'g'], ['fat', 'Lipides', 'g'],
  ['sugars', 'Sucres', 'g'], ['fiber', 'Fibres', 'g'], ['saturatedFat', 'Graisses saturées', 'g'], ['salt', 'Sel', 'g']
];

const formatValue = (value: number | null, unit: string) => value == null ? '—' : `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value)} ${unit}`;

function errorMessage(error: unknown) {
  const code = error instanceof NutritionApiError ? error.code : 'NETWORK_ERROR';
  if (code === 'PRODUCT_NOT_FOUND') return 'Ce produit n’a pas été trouvé dans la base.';
  if (code === 'INVALID_BARCODE') return 'Ce code-barres n’est pas valide. Vérifiez-le puis réessayez.';
  if (code === 'PROVIDER_UNAVAILABLE') return 'Les données nutritionnelles sont temporairement indisponibles. Veuillez réessayer plus tard.';
  return 'La recherche n’a pas pu aboutir. Vérifiez votre connexion puis réessayez.';
}

function NutrientGrid({ values }: { values: NutrientValues }) {
  return <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{nutrientLabels.map(([key, label, unit], index) => (
    <div key={key} className={`rounded-xl bg-white p-4 ${index < 4 ? 'ring-1 ring-slate-200' : ''}`}>
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-xl font-bold text-slate-950">{formatValue(values[key], unit)}</dd>
    </div>
  ))}</dl>;
}

export function FoodNutritionTool() {
  const [barcode, setBarcode] = useState('');
  const [query, setQuery] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState<'product' | 'search' | null>(null);
  const [error, setError] = useState('');
  const [detectedCode, setDetectedCode] = useState('');
  const [results, setResults] = useState<FoodSummary[] | null>(null);
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [quantity, setQuantity] = useState(100);
  const controllerRef = useRef<AbortController | null>(null);
  const scanButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const loadProduct = async (rawBarcode: string) => {
    const cleanBarcode = rawBarcode.replace(/\s+/g, '');
    if (!cleanBarcode) { setError('Saisissez un code-barres.'); return; }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading('product'); setError(''); setProduct(null); setResults(null); setDetectedCode(cleanBarcode);
    try {
      const nextProduct = await getFoodByBarcode(cleanBarcode, controller.signal);
      setProduct(nextProduct);
      setQuantity(100);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(errorMessage(requestError));
    } finally {
      if (controllerRef.current === controller) setLoading(null);
    }
  };

  const submitBarcode = (event: FormEvent) => { event.preventDefault(); void loadProduct(barcode); };
  const submitSearch = async (event: FormEvent) => {
    event.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) { setError('Saisissez le nom d’un aliment ou d’un produit.'); return; }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading('search'); setError(''); setProduct(null); setResults(null);
    try {
      const response = await searchFoods(cleanQuery, controller.signal);
      setResults(response.products ?? []);
    } catch (requestError) {
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(errorMessage(requestError));
    } finally {
      if (controllerRef.current === controller) setLoading(null);
    }
  };

  const closeScanner = () => { setScannerOpen(false); requestAnimationFrame(() => scanButtonRef.current?.focus()); };
  const scanDetected = (code: string) => { setScannerOpen(false); setBarcode(code); void loadProduct(code); };
  const unit = product?.basis === '100ml' ? 'ml' : 'g';
  const portion = useMemo(() => product?.nutrients ? scaleNutrients(product.nutrients, Number.isFinite(quantity) ? quantity : 0) : null, [product, quantity]);

  return (
    <section className="my-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8" aria-labelledby="food-tool-title">
      <h2 id="food-tool-title" className="text-2xl font-bold tracking-tight text-slate-950">Trouver un aliment</h2>
      <p className="mt-2 text-slate-600">Scannez un produit, recherchez son nom ou utilisez son code-barres.</p>

      <div className="mt-6 rounded-2xl bg-brand-50 p-4 sm:p-5">
        <button ref={scanButtonRef} type="button" onClick={() => { setError(''); setScannerOpen(true); }} disabled={scannerOpen} className={`${primaryButton} w-full py-3 text-base sm:w-auto`}>
          <span aria-hidden="true" className="mr-2 text-lg">▣</span> Scanner un code-barres
        </button>
        <p className="mt-2 text-xs text-slate-600">La caméra est activée uniquement après votre clic.</p>
      </div>
      {scannerOpen ? <div className="mt-4"><BarcodeScanner onDetected={scanDetected} onClose={closeScanner} /></div> : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <form onSubmit={submitSearch} className="rounded-2xl border border-slate-200 p-5" role="search">
          <label htmlFor="food-name" className="text-sm font-semibold text-slate-800">Rechercher un aliment ou un produit</label>
          <div className="sm:flex sm:items-end sm:gap-3">
            <input id="food-name" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex. Skyr, yaourt grec…" className={fieldClass} />
            <button type="submit" disabled={loading !== null} className={`${primaryButton} mt-3 w-full sm:w-auto`}>{loading === 'search' ? 'Recherche…' : 'Rechercher'}</button>
          </div>
        </form>
        <div className="rounded-2xl border border-slate-200 p-5">
          <form onSubmit={submitBarcode}>
            <label htmlFor="food-barcode" className="text-sm font-semibold text-slate-800">Saisir un code-barres</label>
            <div className="sm:flex sm:items-end sm:gap-3">
              <input id="food-barcode" type="text" inputMode="numeric" autoComplete="off" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Ex. 3017620422003" className={fieldClass} />
              <button type="submit" disabled={loading !== null} className={`${primaryButton} mt-3 w-full sm:w-auto`}>{loading === 'product' ? 'Chargement…' : 'Valider'}</button>
            </div>
          </form>
          <div className="mt-5 border-t border-slate-200 pt-5"><PhotoBarcodeInput disabled={loading !== null} onDetected={(code) => { setBarcode(code); void loadProduct(code); }} /></div>
        </div>
      </div>

      <div className="mt-6 min-h-12" aria-live="polite" aria-busy={loading !== null}>
        {loading ? <p className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700"><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-700" aria-hidden="true" />{loading === 'search' ? 'Recherche des produits…' : `Recherche du produit${detectedCode ? ` ${detectedCode}` : ''}…`}</p> : null}
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert"><p className="font-semibold">{error}</p><p className="mt-2">Essayez un autre code-barres, scannez un autre produit ou recherchez-le par nom.</p></div> : null}
      </div>

      {results ? <section className="mt-4" aria-labelledby="results-title">
        <h3 id="results-title" className="text-xl font-bold text-slate-950">Résultats ({results.length})</h3>
        {results.length === 0 ? <p className="mt-3 rounded-xl bg-slate-50 p-4 text-slate-700">Aucun produit trouvé. Essayez avec un nom plus précis ou une marque.</p> : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">{results.map((item) => <li key={item.barcode}>
            <button type="button" onClick={() => void loadProduct(item.barcode)} className="flex min-h-24 w-full items-center gap-4 rounded-2xl border border-slate-200 p-3 text-left transition hover:border-brand-500 hover:bg-brand-50 focus:outline-none focus:ring-4 focus:ring-brand-50">
              {item.imageUrl ? <Image src={item.imageUrl} alt="" width={80} height={80} unoptimized className="h-20 w-20 shrink-0 rounded-xl bg-slate-100 object-contain" /> : <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">Sans image</span>}
              <span><strong className="block text-slate-950">{item.name || 'Nom non renseigné'}</strong>{item.brand ? <span className="mt-1 block text-sm text-slate-600">{item.brand}</span> : null}{item.quantity ? <span className="block text-sm text-slate-500">{item.quantity}</span> : null}</span>
            </button>
          </li>)}</ul>
        )}
      </section> : null}

      {product ? <section className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6" aria-labelledby="product-title">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {product.imageUrl ? <Image src={product.imageUrl} alt={`Produit ${product.name || product.barcode}`} width={144} height={144} unoptimized className="h-36 w-36 rounded-2xl bg-white object-contain" /> : <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white text-sm text-slate-500">Image indisponible</div>}
          <div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Produit trouvé</p><h3 id="product-title" className="mt-2 text-2xl font-bold text-slate-950">{product.name || 'Nom non renseigné'}</h3>{product.brand ? <p className="mt-1 text-slate-700">{product.brand}</p> : null}{product.quantity ? <p className="text-sm text-slate-500">{product.quantity}</p> : null}</div>
        </div>
        {!product.nutrients || !product.basis ? <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 font-medium text-amber-950">Les informations nutritionnelles de ce produit ne sont pas disponibles.</p> : <>
          <div className="mt-7"><h4 className="mb-4 text-lg font-bold text-slate-950">Pour 100 {unit}</h4><NutrientGrid values={product.nutrients} /></div>
          <div className="mt-7 max-w-sm"><label htmlFor="food-quantity" className="text-sm font-semibold text-slate-800">Quantité consommée</label><div className="relative"><input id="food-quantity" type="number" min="0" max="10000" step="1" value={quantity} onChange={(event) => setQuantity(event.target.valueAsNumber)} className={`${fieldClass} pr-14 text-lg font-semibold`} /><span className="pointer-events-none absolute bottom-2.5 right-4 font-semibold text-slate-500">{unit}</span></div></div>
          {portion ? <div className="mt-7 rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5"><h4 className="mb-4 text-lg font-bold text-slate-950">Pour votre portion de {Number.isFinite(quantity) ? quantity : 0} {unit}</h4><NutrientGrid values={portion} /></div> : null}
        </>}
      </section> : null}

      <p className="mt-6 text-xs leading-5 text-slate-500">Données produits fournies par <a href="https://world.openfoodfacts.org/" target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">Open Food Facts</a>, une base collaborative dont certaines fiches peuvent être incomplètes. Ces informations ne constituent pas un avis médical.</p>
    </section>
  );
}
