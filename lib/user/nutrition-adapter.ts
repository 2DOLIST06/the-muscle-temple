import type { DiaryEntry, MealType, NutritionDiary, NutritionGoal, NutritionValues, PersonalFood, PersonalFoodInput } from './types';
export interface ApiMacros { caloriesKcal: number | string; proteinG: number | string; carbohydratesG: number | string; fatG: number | string }
export interface ApiGoal extends ApiMacros { id: string; effectiveFrom: string }
export interface ApiEntry {
  id: string; mealType: MealType; snapshotName: string; snapshotBrand: string | null;
  consumedAmount: number | string; consumedUnit: 'G' | 'ML'; recurrenceId?: string | null; computed: ApiMacros;
}
export interface ApiDiary { date: string; goal: ApiGoal | null; totals: ApiMacros; remaining: ApiMacros | null; entries: ApiEntry[] }
export interface ApiPersonalFood extends ApiMacros { id: string; name: string; brand: string | null; basisAmount: number | string; basisUnit: 'G' | 'ML' }

const numeric = (value: unknown): number => {
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '' || !Number.isFinite(Number(value))) throw new Error('Invalid nutrition response');
  return Number(value);
};
export const readMacros = (row: ApiMacros): NutritionValues => ({
  calories: numeric(row.caloriesKcal), protein: numeric(row.proteinG), carbs: numeric(row.carbohydratesG), fat: numeric(row.fatG)
});
export const readGoal = (row: ApiGoal | null): NutritionGoal | null => row ? ({ id: row.id, date: row.effectiveFrom, ...readMacros(row) }) : null;
export const readEntry = (row: ApiEntry): DiaryEntry => ({
  id: row.id, mealType: row.mealType, name: row.snapshotName, brand: row.snapshotBrand,
  quantity: numeric(row.consumedAmount), unit: row.consumedUnit === 'ML' ? 'ml' : 'g', recurrenceId: row.recurrenceId,
  ...readMacros(row.computed)
});
export const readDiary = (row: ApiDiary): NutritionDiary => ({
  date: row.date, goal: readGoal(row.goal), totals: readMacros(row.totals), remaining: row.remaining ? readMacros(row.remaining) : null,
  entries: row.entries.map(readEntry)
});
export const readPersonalFood = (row: ApiPersonalFood): PersonalFood => ({
  id: row.id, name: row.name, brand: row.brand, servingSize: numeric(row.basisAmount), servingUnit: row.basisUnit === 'ML' ? 'ml' : 'g', ...readMacros(row)
});
export function writePersonalFood(value: Partial<PersonalFoodInput>) {
  const pairs = [['name','name'],['brand','brand'],['servingSize','basisAmount'],['calories','caloriesKcal'],['protein','proteinG'],['carbs','carbohydratesG'],['fat','fatG']] as const;
  const result: Record<string, unknown> = {};
  for (const [from, to] of pairs) if (value[from] !== undefined) result[to] = from === 'brand' && !value[from] ? null : value[from];
  if (value.servingUnit !== undefined) result.basisUnit = value.servingUnit.toUpperCase();
  return result;
}
