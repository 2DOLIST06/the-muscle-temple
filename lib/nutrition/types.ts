export type NutritionBasis = '100g' | '100ml';

export type NutrientValues = {
  calories: number | null;
  proteins: number | null;
  carbohydrates: number | null;
  fat: number | null;
  sugars: number | null;
  fiber: number | null;
  saturatedFat: number | null;
  salt: number | null;
};

export type FoodSummary = {
  barcode: string;
  name: string | null;
  brand: string | null;
  quantity: string | null;
  imageUrl: string | null;
};

export type FoodProduct = FoodSummary & {
  basis: NutritionBasis | null;
  nutrients: NutrientValues | null;
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
