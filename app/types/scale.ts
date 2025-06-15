export interface ScaleReading {
  weight: number;
  unit: "g" | "oz" | "lb" | "kg" | "ml" | "fl oz";
  isStable: boolean;
  timestamp: number;
}

export interface Ingredient {
  name: string;
  weight: number;
  unit: string;
  timestamp: number;
}

export interface NutritionData {
  ingredient: string;
  weight: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  calcium?: number;
  iron?: number;
  vitaminC?: number;
}

export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  ingredients: NutritionData[];
}

export type UnitCode = 0 | 1 | 2 | 3 | 4 | 5 | 6; // g, oz/lb:oz, g*10, fl oz, ml, fl oz milk, oz
