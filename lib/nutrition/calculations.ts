import type { NutrientValues } from './types';

export const scaleNutrient = (value: number | null | undefined, quantity: number) =>
  value == null ? null : value * quantity / 100;

export const scaleNutrients = (nutrients: NutrientValues, quantity: number): NutrientValues => ({
  calories: scaleNutrient(nutrients.calories, quantity),
  proteins: scaleNutrient(nutrients.proteins, quantity),
  carbohydrates: scaleNutrient(nutrients.carbohydrates, quantity),
  fat: scaleNutrient(nutrients.fat, quantity),
  sugars: scaleNutrient(nutrients.sugars, quantity),
  fiber: scaleNutrient(nutrients.fiber, quantity),
  saturatedFat: scaleNutrient(nutrients.saturatedFat, quantity),
  salt: scaleNutrient(nutrients.salt, quantity)
});
