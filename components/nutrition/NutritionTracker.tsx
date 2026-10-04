'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { nutritionApi, UserApiError } from '@/lib/user/api-client';
import type { DiaryEntry, MealType, NutritionDiary, NutritionValues } from '@/lib/user/types';
import { useUserSession } from '@/components/user/UserSessionProvider';
import { Container } from '@/components/ui/Container';
import { AddFoodDialog } from './AddFoodDialog';
import { PersonalFoodsManager } from './PersonalFoodsManager';

const meals: MealType[] = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER'];
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const moveDate = (value: string, amount: number) => { const [year, month, day] = value.split('-').map(Number); return localDate(new Date(year, month - 1, day + amount)); };
const number = (value: number, locale: 'fr' | 'en') => new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 }).format(value ?? 0);

export function NutritionTracker({ locale }: { locale: 'fr' | 'en' }) {
  const french = locale === 'fr'; const router = useRouter(); const pathname = usePathname();
  const { status } = useUserSession(); const [date, setDate] = useState(localDate);
  const [diary, setDiary] = useState<NutritionDiary | null>(null); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [workingId, setWorkingId] = useState<string | null>(null); const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [addingMeal, setAddingMeal] = useState<MealType | null>(null); const [managingFoods, setManagingFoods] = useState(false);
  const loginPath = french ? '/fr/connexion' : '/login';
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setDiary(await nutritionApi.diary(date)); }
    catch (cause) {
      if (cause instanceof UserApiError && cause.status === 401) { router.replace(`${loginPath}?returnTo=${encodeURIComponent(pathname)}`); return; }
      setError(french ? 'Impossible de charger votre journal. Réessayez.' : 'Unable to load your diary. Please try again.');
    } finally { setLoading(false); }
  }, [date, french, loginPath, pathname, router]);
  useEffect(() => {
    if (status === 'anonymous' || status === 'expired') router.replace(`${loginPath}?returnTo=${encodeURIComponent(pathname)}`);
    else if (status === 'authenticated') void load();
  }, [status, loginPath, pathname, router, load]);
  const grouped = useMemo(() => Object.fromEntries(meals.map((meal) => [meal, diary?.entries.filter((entry) => entry.mealType === meal) ?? []])) as Record<MealType, DiaryEntry[]>, [diary]);
  const remove = async (entry: DiaryEntry) => {
    if (!window.confirm(french ? `Supprimer « ${entry.name} » ?` : `Delete “${entry.name}”?`)) return;
    setWorkingId(entry.id); setError(''); try { await nutritionApi.deleteEntry(entry.id); await load(); } catch (cause) { if (cause instanceof UserApiError && cause.status === 401) router.replace(`${loginPath}?returnTo=${encodeURIComponent(pathname)}`); else setError(french ? 'Suppression impossible.' : 'Could not delete this entry.'); } finally { setWorkingId(null); }
  };
  const save = async () => {
    if (!editing || !Number.isFinite(editing.quantity) || editing.quantity <= 0) return;
    setWorkingId(editing.id); setError(''); try { await nutritionApi.updateEntry(editing.id, { mealType: editing.mealType, quantity: editing.quantity }); setEditing(null); await load(); } catch (cause) { if (cause instanceof UserApiError && cause.status === 401) router.replace(`${loginPath}?returnTo=${encodeURIComponent(pathname)}`); else setError(french ? 'Modification impossible.' : 'Could not update this entry.'); } finally { setWorkingId(null); }
  };
  if (status === 'loading' || status === 'anonymous' || status === 'expired') return <main className="py-20 text-center text-slate-500">{french ? 'Chargement de votre espace…' : 'Loading your tracker…'}</main>;
  const mealLabels: Record<MealType, string> = french ? { BREAKFAST: 'Petit-déjeuner', LUNCH: 'Déjeuner', SNACK: 'Collation', DINNER: 'Dîner' } : { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', SNACK: 'Snack', DINNER: 'Dinner' };
  return <main className="bg-slate-50 py-8 sm:py-12"><Container>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-widest text-brand-700">{french ? 'Espace membre' : 'Member area'}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{french ? 'Mon suivi Nutrition' : 'My Nutrition Tracker'}</h1><button type="button" onClick={() => setManagingFoods(true)} className="mt-3 text-sm font-bold text-brand-700 underline underline-offset-4">{french ? 'Gérer mes aliments' : 'Manage my foods'}</button></div>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><button aria-label={french ? 'Jour précédent' : 'Previous day'} onClick={() => setDate(moveDate(date, -1))} className="rounded-xl px-3 py-2 font-bold hover:bg-slate-100">←</button><input aria-label={french ? 'Date du journal' : 'Diary date'} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border-0 px-2 py-2 font-semibold"/><button aria-label={french ? 'Jour suivant' : 'Next day'} onClick={() => setDate(moveDate(date, 1))} className="rounded-xl px-3 py-2 font-bold hover:bg-slate-100">→</button><button disabled={date === localDate()} onClick={() => setDate(localDate())} className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 disabled:opacity-40">{french ? "Aujourd'hui" : 'Today'}</button></div>
    </div>
    {error ? <div role="alert" className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"><span>{error}</span><button onClick={() => void load()} className="font-bold underline">{french ? 'Réessayer' : 'Retry'}</button></div> : null}
    {loading ? <div className="mt-8 grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">{meals.map((item) => <div key={item} className="h-40 rounded-2xl bg-slate-200" />)}</div> : diary ? <>
      {diary.goal ? <MacroProgress goal={diary.goal} totals={diary.totals} remaining={diary.remaining} locale={locale} /> : <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:flex sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-amber-950">{french ? "Vous n'avez pas encore défini vos objectifs nutritionnels." : "You haven't set your nutrition targets yet."}</h2><p className="mt-1 text-sm text-amber-900">{french ? 'Calculez des repères adaptés à votre profil.' : 'Calculate targets tailored to your profile.'}</p></div><Link href={french ? '/fr/calculateur-macros' : '/macro-calculator'} className="mt-4 inline-flex rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white sm:mt-0">{french ? 'Calculer mes besoins' : 'Calculate my targets'}</Link></section>}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">{meals.map((meal) => <section key={meal} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="text-xl font-bold text-slate-950">{mealLabels[meal]}</h2><button type="button" onClick={() => setAddingMeal(meal)} className="rounded-lg border border-brand-200 px-3 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50">+ {french ? 'Ajouter un aliment' : 'Add food'}</button></div>
        {grouped[meal].length ? <ul className="divide-y divide-slate-100">{grouped[meal].map((entry) => <li key={entry.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-bold text-slate-900">{entry.name}</h3>{entry.brand ? <p className="text-sm text-slate-500">{entry.brand}</p> : null}<p className="mt-1 text-sm text-slate-600">{number(entry.quantity, locale)} {entry.unit}</p></div><p className="shrink-0 font-bold text-brand-700">{number(entry.calories, locale)} kcal</p></div><dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-600"><div><dt>{french ? 'Protéines' : 'Protein'}</dt><dd className="font-bold text-slate-900">{number(entry.protein, locale)} g</dd></div><div><dt>{french ? 'Glucides' : 'Carbs'}</dt><dd className="font-bold text-slate-900">{number(entry.carbs, locale)} g</dd></div><div><dt>{french ? 'Lipides' : 'Fat'}</dt><dd className="font-bold text-slate-900">{number(entry.fat, locale)} g</dd></div></dl><div className="mt-4 flex gap-2"><button disabled={workingId === entry.id} onClick={() => setEditing({ ...entry })} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold hover:bg-slate-200">{french ? 'Modifier' : 'Edit'}</button><button disabled={workingId === entry.id} onClick={() => void remove(entry)} className="rounded-lg px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">{workingId === entry.id ? '…' : french ? 'Supprimer' : 'Delete'}</button></div></li>)}</ul> : <p className="p-6 text-sm text-slate-500">{french ? 'Aucune entrée pour ce repas.' : 'No entries for this meal.'}</p>}</section>)}</div>
    </> : null}
    {editing ? <EditDialog entry={editing} locale={locale} busy={workingId === editing.id} labels={mealLabels} onChange={setEditing} onClose={() => setEditing(null)} onSave={() => void save()} /> : null}
    {addingMeal ? <AddFoodDialog locale={locale} date={date} mealType={addingMeal} onClose={() => setAddingMeal(null)} onAdded={load} /> : null}
    {managingFoods ? <PersonalFoodsManager locale={locale} onClose={() => setManagingFoods(false)} /> : null}
  </Container></main>;
}

function MacroProgress({ goal, totals, remaining, locale }: { goal: NutritionValues; totals: NutritionValues; remaining: NutritionValues; locale: 'fr' | 'en' }) {
  const french = locale === 'fr'; const items: Array<[keyof NutritionValues, string, string]> = [['calories', 'Calories', 'kcal'], ['protein', french ? 'Protéines' : 'Protein', 'g'], ['carbs', french ? 'Glucides' : 'Carbs', 'g'], ['fat', french ? 'Lipides' : 'Fat', 'g']];
  return <section aria-label={french ? 'Progression nutritionnelle' : 'Nutrition progress'} className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(([key, label, unit]) => { const percent = goal[key] > 0 ? Math.min(100, Math.max(0, totals[key] / goal[key] * 100)) : 0; return <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-950">{label}</h2><p className="mt-2 text-2xl font-extrabold text-brand-700">{number(totals[key], locale)} <span className="text-sm font-semibold">{unit}</span></p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} /></div><dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><dt className="text-slate-500">{french ? 'Objectif' : 'Target'}</dt><dd className="font-bold">{number(goal[key], locale)} {unit}</dd></div><div><dt className="text-slate-500">{french ? 'Restant' : 'Remaining'}</dt><dd className={`font-bold ${remaining[key] < 0 ? 'text-red-700' : ''}`}>{number(remaining[key], locale)} {unit}</dd></div></dl></article>; })}</section>;
}

function EditDialog({ entry, locale, busy, labels, onChange, onClose, onSave }: { entry: DiaryEntry; locale: 'fr' | 'en'; busy: boolean; labels: Record<MealType, string>; onChange: (entry: DiaryEntry) => void; onClose: () => void; onSave: () => void }) {
  const french = locale === 'fr'; return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"><h2 id="edit-title" className="text-xl font-bold">{french ? 'Modifier une entrée' : 'Edit entry'}</h2><p className="mt-1 text-sm text-slate-500">{entry.name}</p><label className="mt-5 block text-sm font-bold">{french ? 'Repas' : 'Meal'}<select value={entry.mealType} onChange={(e) => onChange({ ...entry, mealType: e.target.value as MealType })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3">{meals.map((meal) => <option key={meal} value={meal}>{labels[meal]}</option>)}</select></label><label className="mt-4 block text-sm font-bold">{french ? 'Quantité' : 'Quantity'} ({entry.unit})<input type="number" min="0.01" step="any" value={entry.quantity} onChange={(e) => onChange({ ...entry, quantity: e.target.valueAsNumber })} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" /></label><div className="mt-6 flex justify-end gap-3"><button disabled={busy} onClick={onClose} className="rounded-xl px-4 py-2 font-bold text-slate-600">{french ? 'Annuler' : 'Cancel'}</button><button disabled={busy || !entry.quantity || entry.quantity <= 0} onClick={onSave} className="rounded-xl bg-brand-700 px-5 py-2 font-bold text-white disabled:opacity-50">{busy ? '…' : french ? 'Enregistrer' : 'Save'}</button></div></div></div>;
}
