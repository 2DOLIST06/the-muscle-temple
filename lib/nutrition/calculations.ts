import type { NutrientValues } from './types';

export const scaleNutrient = (value: number | null | undefined, quantity: number) =>
  value == null ? null : value * quantity / 100;

export const scaleNutrients = (nutrients: NutrientValues, quantity: number, basisAmount = 100): NutrientValues => ({
  caloriesKcal: scaleNutrient(nutrients.caloriesKcal, quantity * 100 / basisAmount),
  energyKj: scaleNutrient(nutrients.energyKj, quantity * 100 / basisAmount),
  proteinG: scaleNutrient(nutrients.proteinG, quantity * 100 / basisAmount),
  carbohydratesG: scaleNutrient(nutrients.carbohydratesG, quantity * 100 / basisAmount),
  fatG: scaleNutrient(nutrients.fatG, quantity * 100 / basisAmount),
  saturatedFatG: scaleNutrient(nutrients.saturatedFatG, quantity * 100 / basisAmount),
  sugarsG: scaleNutrient(nutrients.sugarsG, quantity * 100 / basisAmount),
  fiberG: scaleNutrient(nutrients.fiberG, quantity * 100 / basisAmount),
  saltG: scaleNutrient(nutrients.saltG, quantity * 100 / basisAmount),
  sodiumG: scaleNutrient(nutrients.sodiumG, quantity * 100 / basisAmount)
});
