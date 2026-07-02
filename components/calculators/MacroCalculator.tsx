'use client';

import { useId, useMemo, useState } from 'react';

type Locale = 'fr' | 'en' | 'en-CA';
type Sex = 'male' | 'female';
type ActivityKey = 'sedentary' | 'light' | 'moderate' | 'high' | 'veryHigh';
type GoalKey = 'maintenance' | 'leanGain' | 'bulk' | 'cut';
type HeadingLevel = 'h2' | 'h3' | 'div';

type Translation = {
  title: string;
  description: string;
  fields: Record<'sex' | 'age' | 'height' | 'weight' | 'activity' | 'goal', string>;
  units: Record<'years' | 'cm' | 'kg' | 'kcal' | 'gramsPerDay' | 'kcalPerDay', string>;
  sexes: Record<Sex, string>;
  activities: Record<ActivityKey, string>;
  goals: Record<GoalKey, string>;
  resultsTitle: string;
  bmr: string;
  maintenance: string;
  target: string;
  protein: string;
  carbs: string;
  fats: string;
  calorieSplit: string;
  macroCalories: Record<'protein' | 'carbs' | 'fats', string>;
  error: string;
  guidance: string;
  readingTitle: string;
  readingBullets: string[];
  sources: string;
};

const translations: Record<Locale, Translation> = {
  fr: {
    title: 'Calculateur de macros musculation',
    description: 'Estimez vos calories, protéines, glucides et lipides selon votre objectif.',
    fields: { sex: 'Sexe', age: 'Âge', height: 'Taille', weight: 'Poids', activity: 'Niveau d’activité', goal: 'Objectif' },
    units: { years: 'ans', cm: 'cm', kg: 'kg', kcal: 'kcal', gramsPerDay: 'g / jour', kcalPerDay: 'kcal / jour' },
    sexes: { male: 'Homme', female: 'Femme' },
    activities: {
      sedentary: 'Sédentaire : peu ou pas d’activité',
      light: 'Léger : 1 à 2 séances par semaine',
      moderate: 'Modéré : 3 à 4 séances par semaine',
      high: 'Élevé : 5 à 6 séances par semaine',
      veryHigh: 'Très élevé : entraînement fréquent + activité physique importante'
    },
    goals: { maintenance: 'Maintien', leanGain: 'Prise de muscle progressive', bulk: 'Prise de masse', cut: 'Sèche / perte de gras' },
    resultsTitle: 'Vos repères de départ',
    bmr: 'Métabolisme de base estimé',
    maintenance: 'Calories de maintien estimées',
    target: 'Calories cibles selon l’objectif',
    protein: 'Protéines',
    carbs: 'Glucides',
    fats: 'Lipides',
    calorieSplit: 'Répartition calorique',
    macroCalories: { protein: 'Protéines', carbs: 'Glucides', fats: 'Lipides' },
    error: 'Les calories cibles sont trop basses pour cette répartition. Essayez un objectif moins agressif ou vérifiez les données saisies.',
    guidance: 'Ces résultats sont des repères de départ. Ils doivent être ajustés selon l’évolution du poids, des performances, de la récupération et du ressenti.',
    readingTitle: 'Comment lire le résultat',
    readingBullets: [
      'Les protéines servent de base pour soutenir la masse musculaire.',
      'Les lipides doivent rester suffisants pour l’équilibre général.',
      'Les glucides sont ajustés selon les calories restantes, l’objectif et l’activité.',
      'Les résultats doivent être ajustés après 2 à 4 semaines selon l’évolution.'
    ],
    sources: 'Sources : formule Mifflin-St Jeor pour estimer le métabolisme de base ; repères protéines en musculation basés sur les positions de l’International Society of Sports Nutrition ; calories par macro : protéines 4 kcal/g, glucides 4 kcal/g, lipides 9 kcal/g.'
  },
  en: {
    title: 'Muscle-Building Macro Calculator',
    description: 'Estimate your calories, protein, carbs, and fats based on your goal.',
    fields: { sex: 'Sex', age: 'Age', height: 'Height', weight: 'Weight', activity: 'Activity level', goal: 'Goal' },
    units: { years: 'years', cm: 'cm', kg: 'kg', kcal: 'kcal', gramsPerDay: 'g / day', kcalPerDay: 'kcal / day' },
    sexes: { male: 'Male', female: 'Female' },
    activities: {
      sedentary: 'Sedentary: little or no activity',
      light: 'Light: 1 to 2 sessions per week',
      moderate: 'Moderate: 3 to 4 sessions per week',
      high: 'High: 5 to 6 sessions per week',
      veryHigh: 'Very high: frequent training + significant physical activity'
    },
    goals: { maintenance: 'Maintenance', leanGain: 'Progressive muscle gain', bulk: 'Bulking', cut: 'Cutting / fat loss' },
    resultsTitle: 'Your starting targets',
    bmr: 'Estimated basal metabolic rate',
    maintenance: 'Estimated maintenance calories',
    target: 'Target calories for your goal',
    protein: 'Protein',
    carbs: 'Carbs',
    fats: 'Fats',
    calorieSplit: 'Calorie split',
    macroCalories: { protein: 'Protein', carbs: 'Carbs', fats: 'Fats' },
    error: 'Target calories are too low for this macro split. Try a less aggressive goal or check the entered data.',
    guidance: 'These results are starting reference points. They should be adjusted based on changes in weight, performance, recovery, and how you feel.',
    readingTitle: 'How to read the result',
    readingBullets: [
      'Protein provides a base to support muscle mass.',
      'Fats should remain sufficient for general balance.',
      'Carbs are adjusted based on remaining calories, the goal, and activity.',
      'Results should be adjusted after 2 to 4 weeks based on progress.'
    ],
    sources: 'Sources: Mifflin-St Jeor formula for estimating basal metabolic rate; muscle-building protein targets based on International Society of Sports Nutrition positions; calories per macro: protein 4 kcal/g, carbs 4 kcal/g, fats 9 kcal/g.'
  },
  'en-CA': {} as Translation
};
translations['en-CA'] = translations.en;

const activityFactors: Record<ActivityKey, number> = {
  // Activity factors multiply BMR to estimate maintenance calories.
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  veryHigh: 1.9
};

const goalAdjustments: Record<GoalKey, number> = {
  // Conservative calorie adjustments by goal: maintenance, +5%, +10%, or -15%.
  maintenance: 1,
  leanGain: 1.05,
  bulk: 1.1,
  cut: 0.85
};

const macroCoefficients: Record<GoalKey, { protein: number; fat: number }> = {
  // Protein and fat coefficients are grams per kilogram of body weight.
  maintenance: { protein: 1.8, fat: 0.9 },
  leanGain: { protein: 2, fat: 0.9 },
  bulk: { protein: 1.8, fat: 1 },
  cut: { protein: 2.2, fat: 0.8 }
};

const numberFormatter = (locale: Locale) => new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-CA', { maximumFractionDigits: 0 });

export function MacroCalculator({ locale = 'fr', hideTitle = false, headingLevel = 'h2' }: { locale?: string; hideTitle?: boolean; headingLevel?: HeadingLevel }) {
  const safeLocale: Locale = locale === 'en' || locale === 'en-CA' ? locale : 'fr';
  const t = translations[safeLocale];
  const titleId = useId();
  const format = numberFormatter(safeLocale);
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState(30);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(75);
  const [activity, setActivity] = useState<ActivityKey>('moderate');
  const [goal, setGoal] = useState<GoalKey>('leanGain');

  const result = useMemo(() => {
    // Mifflin-St Jeor formula estimates basal metabolic rate from weight, height, age, and sex.
    const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'male' ? 5 : -161);
    const maintenance = bmr * activityFactors[activity];
    const targetCalories = maintenance * goalAdjustments[goal];
    const proteinGrams = weight * macroCoefficients[goal].protein;
    const fatGrams = weight * macroCoefficients[goal].fat;
    const proteinCalories = proteinGrams * 4;
    const fatCalories = fatGrams * 9;
    const remainingCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = Math.max(0, remainingCalories / 4);
    return { bmr, maintenance, targetCalories, proteinGrams, fatGrams, proteinCalories, fatCalories, remainingCalories, carbGrams, carbCalories: carbGrams * 4 };
  }, [activity, age, goal, height, sex, weight]);

  const TitleTag = headingLevel;
  const fieldClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200';
  const labelClass = 'text-sm font-semibold text-slate-800';

  return (
    <section className="my-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8" aria-label={hideTitle ? t.title : undefined} aria-labelledby={hideTitle ? undefined : titleId}>
      {!hideTitle ? <TitleTag id={titleId} className="text-2xl font-bold tracking-tight text-slate-950">{t.title}</TitleTag> : null}
      <p className={hideTitle ? 'text-base text-slate-600' : 'mt-2 text-base text-slate-600'}>{t.description}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className={labelClass}>{t.fields.sex}<select className={fieldClass} value={sex} onChange={(event) => setSex(event.target.value as Sex)}><option value="male">{t.sexes.male}</option><option value="female">{t.sexes.female}</option></select></label>
        <label className={labelClass}>{t.fields.age}<input className={fieldClass} type="number" min={14} max={90} step={1} value={age} onChange={(event) => setAge(Number(event.target.value))} /></label>
        <label className={labelClass}>{t.fields.height} ({t.units.cm})<input className={fieldClass} type="number" min={120} max={230} step={1} value={height} onChange={(event) => setHeight(Number(event.target.value))} /></label>
        <label className={labelClass}>{t.fields.weight} ({t.units.kg})<input className={fieldClass} type="number" min={30} max={250} step={0.1} value={weight} onChange={(event) => setWeight(Number(event.target.value))} /></label>
        <label className={labelClass}>{t.fields.activity}<select className={fieldClass} value={activity} onChange={(event) => setActivity(event.target.value as ActivityKey)}>{(Object.keys(activityFactors) as ActivityKey[]).map((key) => <option key={key} value={key}>{t.activities[key]}</option>)}</select></label>
        <label className={labelClass}>{t.fields.goal}<select className={fieldClass} value={goal} onChange={(event) => setGoal(event.target.value as GoalKey)}>{(Object.keys(goalAdjustments) as GoalKey[]).map((key) => <option key={key} value={key}>{t.goals[key]}</option>)}</select></label>
      </div>

      <div className="mt-8 rounded-2xl bg-slate-50 p-5" aria-live="polite">
        <h3 className="text-xl font-bold text-slate-950">{t.resultsTitle}</h3>
        {result.remainingCalories < 0 ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">{t.error}</p> : null}
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {[[t.bmr, result.bmr, t.units.kcalPerDay], [t.maintenance, result.maintenance, t.units.kcalPerDay], [t.target, result.targetCalories, t.units.kcalPerDay], [t.protein, result.proteinGrams, t.units.gramsPerDay], [t.carbs, result.carbGrams, t.units.gramsPerDay], [t.fats, result.fatGrams, t.units.gramsPerDay]].map(([label, value, unit]) => (
            <div key={label as string} className="rounded-xl bg-white p-4"><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-bold text-slate-950">{format.format(Math.round(value as number))} <span className="text-sm font-semibold text-slate-500">{unit}</span></dd></div>
          ))}
        </dl>
        <div className="mt-5 rounded-xl bg-white p-4"><h4 className="font-semibold text-slate-900">{t.calorieSplit}</h4><ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3"><li>{t.macroCalories.protein} : {format.format(Math.round(result.proteinCalories))} {t.units.kcal}</li><li>{t.macroCalories.carbs} : {format.format(Math.round(result.carbCalories))} {t.units.kcal}</li><li>{t.macroCalories.fats} : {format.format(Math.round(result.fatCalories))} {t.units.kcal}</li></ul></div>
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{t.guidance}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 p-5"><h3 className="text-lg font-bold text-slate-950">{t.readingTitle}</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">{t.readingBullets.map((item) => <li key={item}>{item}</li>)}</ul></div>
      <p className="mt-4 text-xs leading-6 text-slate-500">{t.sources}</p>
    </section>
  );
}

export default MacroCalculator;
