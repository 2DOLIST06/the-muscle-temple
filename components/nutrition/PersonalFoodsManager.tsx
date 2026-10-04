'use client';

import { useEffect, useState } from 'react';
import { nutritionApi } from '@/lib/user/api-client';
import type { PersonalFood } from '@/lib/user/types';
import { PersonalFoodForm } from './PersonalFoodForm';

export function PersonalFoodsManager({ locale, onClose }: { locale: 'fr' | 'en'; onClose: () => void }) {
  const french = locale === 'fr'; const [foods, setFoods] = useState<PersonalFood[]>([]); const [editing, setEditing] = useState<PersonalFood | null | 'new'>(null); const [error, setError] = useState('');
  const load = async () => { try { setFoods(await nutritionApi.personalFoods()); } catch { setError(french ? 'Impossible de charger vos aliments.' : 'Unable to load your foods.'); } };
  useEffect(() => { void load(); const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const remove = async (food: PersonalFood) => { if (!window.confirm(french ? `Supprimer « ${food.name} » ?` : `Delete “${food.name}”?`)) return; try { await nutritionApi.deletePersonalFood(food.id); setFoods((current) => current.filter((item) => item.id !== food.id)); } catch { setError(french ? 'Suppression impossible.' : 'Unable to delete this food.'); } };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="manage-food-title"><div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-xl sm:p-6"><div className="flex items-center justify-between"><h2 id="manage-food-title" className="text-xl font-bold">{french ? 'Gérer mes aliments' : 'Manage my foods'}</h2><button autoFocus type="button" onClick={onClose} aria-label={french ? 'Fermer' : 'Close'} className="rounded-full border px-4 py-2 font-bold">×</button></div>
    <button type="button" onClick={() => setEditing('new')} className="mt-5 rounded-xl bg-brand-700 px-4 py-2.5 font-bold text-white">+ {french ? 'Créer un aliment' : 'Create custom food'}</button>
    {editing ? <div className="mt-4"><PersonalFoodForm locale={locale} food={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={(saved) => { setFoods((current) => editing === 'new' ? [saved, ...current] : current.map((item) => item.id === saved.id ? saved : item)); setEditing(null); }} /></div> : null}
    <ul className="mt-5 divide-y divide-slate-100">{foods.map((food) => <li key={food.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><strong>{food.name}</strong>{food.brand ? <span className="ml-2 text-sm text-slate-500">{food.brand}</span> : null}<p className="text-sm text-slate-600">{food.servingSize} {food.servingUnit} · {food.calories} kcal · P {food.protein} g · G {food.carbs} g · L {food.fat} g</p></div><div className="flex gap-2"><button type="button" onClick={() => setEditing(food)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold">{french ? 'Modifier' : 'Edit'}</button><button type="button" onClick={() => void remove(food)} className="rounded-lg px-3 py-2 text-sm font-bold text-red-700">{french ? 'Supprimer' : 'Delete'}</button></div></li>)}</ul>
    {error ? <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{error}</p> : null}
  </div></div>;
}
