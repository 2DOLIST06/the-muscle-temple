export type NutritionBasis = {
  unit: 'g' | 'ml';
  amount: number;
};

/** Nutrition values as returned by the public nutrition API. */
export type NutrientValues = {
  caloriesKcal: number | null;
  energyKj: number | null;
  proteinG: number | null;
  carbohydratesG: number | null;
  fatG: number | null;
  saturatedFatG: number | null;
  sugarsG: number | null;
  fiberG: number | null;
  saltG: number | null;
  sodiumG: number | null;
};

export type FoodSummary = {
  barcode: string;
  name: string | null;
  brand: string | null;
  image: string | null;
  quantityLabel: string | null;
};

export type FoodProduct = FoodSummary & {
  source: string;
  sourceUrl: string | null;
  servingSize: string | null;
  nutritionBasis: NutritionBasis | null;
  nutritionAvailable: boolean;
  nutrition: NutrientValues | null;
};

export type FoodSearchResponse = { products: FoodSummary[] };

export type NutritionErrorCode =
  | 'PRODUCT_NOT_FOUND'
  | 'INVALID_BARCODE'
  | 'PROVIDER_UNAVAILABLE'
  | 'NETWORK_ERROR';

export class NutritionApiError extends Error {
  constructor(public readonly code: NutritionErrorCode) {
    super(code);
    this.name = 'NutritionApiError';
  }
}
