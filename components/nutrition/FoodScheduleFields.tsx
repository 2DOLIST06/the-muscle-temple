'use client';
import { useId } from 'react';
import type { FoodSchedule } from '@/lib/user/types';
const input = 'mt-2 block w-full rounded-xl border border-slate-300 px-3 py-2';
export const weekdayLabels = (locale: 'fr' | 'en') => locale === 'fr' ? ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function FoodScheduleFields({ locale, date, onDateChange, schedule, onChange }: {
  locale: 'fr' | 'en'; date: string; onDateChange: (date: string) => void; schedule?: FoodSchedule; onChange: (schedule: FoodSchedule | undefined) => void;
}) {
  const modeId = useId();
  const fr = locale === 'fr'; const days = weekdayLabels(locale);
  return <fieldset className="my-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <legend className="px-2 font-bold">{fr ? 'Quand ajouter cet aliment ?' : 'When should this food be added?'}</legend>
    <div className="flex flex-wrap gap-4"><label><input type="radio" name={modeId} checked={!schedule} onChange={() => onChange(undefined)} /> {fr ? 'Une seule date' : 'One date'}</label><label><input type="radio" name={modeId} checked={Boolean(schedule)} onChange={() => onChange({ startDate: date, weekdays: [0, 1, 2, 3, 4, 5, 6] })} /> {fr ? 'Répéter' : 'Repeat'}</label></div>
    {!schedule ? <label className="block text-sm font-semibold">{fr ? 'Date' : 'Date'}<input type="date" required value={date} onChange={e => { if (e.target.value) onDateChange(e.target.value); }} className={input} /></label> : <>
      <p className="text-sm text-slate-600">{fr ? 'Tous les jours par défaut. Décochez les jours qui ne vous conviennent pas.' : 'Every day by default. Uncheck any days you do not want.'}</p>
      <div className="flex flex-wrap gap-3">{[1, 2, 3, 4, 5, 6, 0].map(day => <label key={day} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><input type="checkbox" checked={schedule.weekdays.includes(day)} onChange={e => onChange({ ...schedule, weekdays: e.target.checked ? [...schedule.weekdays, day] : schedule.weekdays.filter(value => value !== day) })} />{days[day]}</label>)}</div>
      {!schedule.weekdays.length && <p role="alert" className="text-sm text-red-700">{fr ? 'Choisissez au moins un jour.' : 'Choose at least one day.'}</p>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">{fr ? 'À partir du' : 'Starting on'}<input type="date" required value={schedule.startDate} onChange={e => onChange({ ...schedule, startDate: e.target.value })} className={input} /></label><label className="text-sm font-semibold">{fr ? 'Jusqu’au (facultatif, inclus)' : 'Until (optional, inclusive)'}<input type="date" min={schedule.startDate} value={schedule.endDate ?? ''} onChange={e => onChange({ ...schedule, endDate: e.target.value || null })} className={input} /></label></div>
      {schedule.endDate && schedule.endDate < schedule.startDate && <p role="alert" className="text-sm text-red-700">{fr ? 'La date de fin doit suivre la date de début.' : 'The end date must not precede the start date.'}</p>}
      <p className="text-sm text-slate-600">{fr ? 'Sans date de fin, la récurrence continue jusqu’à son arrêt dans le suivi.' : 'Without an end date, this repeats until you stop it in your tracker.'}</p>
    </>}
  </fieldset>;
}
export const validFoodSchedule = (value?: FoodSchedule) => !value || (Boolean(value.startDate) && value.weekdays.length > 0 && (!value.endDate || value.endDate >= value.startDate));
