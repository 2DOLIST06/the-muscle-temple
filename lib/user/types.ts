export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'USER';
}

export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER';

export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NutritionGoal extends NutritionValues {
  id?: string;
  date?: string;
}

export interface DiaryEntry extends NutritionValues {
  id: string;
  mealType: MealType;
  name: string;
  brand?: string | null;
  quantity: number;
  unit: string;
}

export interface NutritionDiary {
  date: string;
  goal: NutritionGoal | null;
  totals: NutritionValues;
  remaining: NutritionValues;
  entries: DiaryEntry[];
}

export interface PersonalFood extends NutritionValues {
  id: string;
  name: string;
  brand?: string | null;
  servingSize: number;
  servingUnit: 'g' | 'ml';
}

export interface NutritionGoalInput {
  effectiveFrom: string;
  caloriesKcal: number;
  proteinG: number;
  carbohydratesG: number;
  fatG: number;
}

export interface PersonalFoodInput {
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: 'g' | 'ml';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type DiaryEntryInput = {
  date: string;
  mealType: MealType;
  consumedAmount: number;
} & ({ sourceType: 'OPEN_FOOD_FACTS'; barcode: string } | { sourceType: 'PERSONAL'; personalFoodId: string });
