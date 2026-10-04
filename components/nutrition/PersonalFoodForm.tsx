'use client';

import { FormEvent, useEffect, useState } from 'react';
import { nutritionApi } from '@/lib/user/api-client';
import type { PersonalFood, PersonalFoodInput } from '@/lib/user/types';

const empty: PersonalFoodInput = { name: '', brand: '', servingSize: 100, servingUnit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0 };
const inputClass = 'mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200';

export function PersonalFoodForm({ locale, food, onSaved, onCancel }: { locale: 'fr' | 'en'; food?: PersonalFood | null; onSaved: (food: PersonalFood) => void; onCancel?: () => void }) {
  const french = locale === 'fr';
  const [value, setValue] = useState<PersonalFoodInput>(empty); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => setValue(food ? { name: food.name, brand: food.brand ?? '', servingSize: food.servingSize, servingUnit: food.servingUnit, calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat } : empty), [food]);
  const numeric = (key: keyof Pick<PersonalFoodInput, 'servingSize' | 'calories' | 'protein' | 'carbs' | 'fat'>, raw: number) => setValue((current) => ({ ...current, [key]: raw }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { const saved = food ? await nutritionApi.updatePersonalFood(food.id, value) : await nutritionApi.createPersonalFood(value); onSaved(saved); if (!food) setValue(empty); }
    catch { setError(french ? 'Impossible d’enregistrer cet aliment.' : 'Unable to save this food.'); }
    finally { setBusy(false); }
  };
  const valid = value.name.trim() && value.servingSize > 0 && [value.calories, value.protein, value.carbs, value.fat].every((item) => Number.isFinite(item) && item >= 0);
  return <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-bold">{french ? 'Nom' : 'Name'}<input required value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} className={inputClass} placeholder={french ? 'Lasagnes maison' : 'Homemade lasagna'} /></label>
      <label className="text-sm font-bold">{french ? 'Marque (optionnelle)' : 'Brand (optional)'}<input value={value.brand} onChange={(e) => setValue({ ...value, brand: e.target.value })} className={inputClass} /></label>
      <label className="text-sm font-bold">{french ? 'Base' : 'Basis'}<input required type="number" min="0.01" step="any" value={value.servingSize} onChange={(e) => numeric('servingSize', e.target.valueAsNumber)} className={inputClass} /></label>
      <label className="text-sm font-bold">{french ? 'Unité' : 'Unit'}<select value={value.servingUnit} onChange={(e) => setValue({ ...value, servingUnit: e.target.value as 'g' | 'ml' })} className={inputClass}><option value="g">g</option><option value="ml">ml</option></select></label>
      {([['calories', 'Calories', 'kcal'], ['protein', french ? 'Protéines' : 'Protein', 'g'], ['carbs', french ? 'Glucides' : 'Carbs', 'g'], ['fat', french ? 'Lipides' : 'Fat', 'g']] as const).map(([key, label, unit]) => <label key={key} className="text-sm font-bold">{label} ({unit})<input required type="number" min="0" step="any" value={value[key]} onChange={(e) => numeric(key, e.target.valueAsNumber)} className={inputClass} /></label>)}
    </div>
    {error ? <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
    <div className="mt-4 flex flex-wrap justify-end gap-2">{onCancel ? <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2 font-bold text-slate-600">{french ? 'Annuler' : 'Cancel'}</button> : null}<button disabled={busy || !valid} className="rounded-xl bg-brand-700 px-5 py-2.5 font-bold text-white disabled:opacity-50">{busy ? '…' : french ? 'Enregistrer' : 'Save'}</button></div>
  </form>;
}
