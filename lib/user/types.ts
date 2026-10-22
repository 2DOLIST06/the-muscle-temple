export interface ContactDetails {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

export interface User extends ContactDetails {
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
  recurrenceId?: string | null;
}

export interface NutritionDiary {
  date: string;
  goal: NutritionGoal | null;
  totals: NutritionValues;
  remaining: NutritionValues | null;
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
  recurrence?: FoodSchedule;
} & ({ sourceType: 'OPEN_FOOD_FACTS'; barcode: string } | { sourceType: 'PERSONAL'; personalFoodId: string });

export interface FoodSchedule {
  startDate: string;
  endDate?: string | null;
  weekdays: number[];
}
export interface FoodRecurrence extends FoodSchedule {
  id: string;
  name: string;
  mealType: MealType;
}
