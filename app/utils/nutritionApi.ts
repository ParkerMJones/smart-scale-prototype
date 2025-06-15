import type { NutritionData } from "~/types/scale";
import { convertWeight } from "./scaleUtils";

// Mock nutrition data for common ingredients
const MOCK_NUTRITION_DATA: Record<string, Partial<NutritionData>> = {
  apple: {
    calories: 52, // per 100g
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10.4,
    vitaminC: 4.6,
  },
  banana: {
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    fiber: 2.6,
    sugar: 12.2,
    calcium: 5,
  },
  "chicken breast": {
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sodium: 74,
    iron: 0.7,
  },
  rice: {
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    fiber: 0.4,
    sodium: 1,
    iron: 0.8,
  },
  broccoli: {
    calories: 34,
    protein: 2.8,
    carbs: 6.6,
    fat: 0.4,
    fiber: 2.6,
    vitaminC: 89.2,
    calcium: 47,
  },
  milk: {
    calories: 42,
    protein: 3.4,
    carbs: 5,
    fat: 1,
    fiber: 0,
    calcium: 113,
    sodium: 44,
  },
};

/**
 * Get nutrition data for an ingredient
 * First tries USDA API, falls back to mock data
 */
export async function getNutritionData(
  ingredient: string,
  weight: number,
  unit: string
): Promise<NutritionData> {
  const weightInGrams = convertWeight(weight, unit, "g");

  try {
    // Try USDA API first
    const usdaData = await fetchUSDANutrition(ingredient);
    if (usdaData) {
      return calculateNutritionForWeight(usdaData, ingredient, weightInGrams);
    }
  } catch (error) {
    console.warn("USDA API failed, falling back to mock data:", error);
  }

  // Fall back to mock data
  const mockData = getMockNutritionData(ingredient);
  return calculateNutritionForWeight(mockData, ingredient, weightInGrams);
}

/**
 * Fetch nutrition data from USDA FoodData Central API
 * Note: Requires API key in production
 */
async function fetchUSDANutrition(
  _ingredient: string
): Promise<Partial<NutritionData> | null> {
  // In a real app, you'd use a proper API key
  // const API_KEY = process.env.USDA_API_KEY;
  // For demo purposes, we'll simulate an API call

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // For demo, return null to use mock data
  // In production, implement actual USDA API call:
  /*
  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(ingredient)}&api_key=${API_KEY}`
  );
  const data = await response.json();
  return parseUSDAResponse(data);
  */

  return null;
}

/**
 * Get mock nutrition data for an ingredient
 */
function getMockNutritionData(ingredient: string): Partial<NutritionData> {
  const normalizedIngredient = ingredient.toLowerCase().trim();

  // Try exact match first
  if (MOCK_NUTRITION_DATA[normalizedIngredient]) {
    return MOCK_NUTRITION_DATA[normalizedIngredient];
  }

  // Try partial matches
  for (const [key, data] of Object.entries(MOCK_NUTRITION_DATA)) {
    if (
      normalizedIngredient.includes(key) ||
      key.includes(normalizedIngredient)
    ) {
      return data;
    }
  }

  // Default fallback
  return {
    calories: 100,
    protein: 2,
    carbs: 15,
    fat: 1,
    fiber: 2,
  };
}

/**
 * Calculate nutrition values for a specific weight
 */
function calculateNutritionForWeight(
  baseData: Partial<NutritionData>,
  ingredient: string,
  weightInGrams: number
): NutritionData {
  const factor = weightInGrams / 100; // Base data is per 100g

  return {
    ingredient,
    weight: weightInGrams,
    unit: "g",
    calories: Math.round((baseData.calories || 0) * factor),
    protein: Math.round((baseData.protein || 0) * factor * 10) / 10,
    carbs: Math.round((baseData.carbs || 0) * factor * 10) / 10,
    fat: Math.round((baseData.fat || 0) * factor * 10) / 10,
    fiber: baseData.fiber
      ? Math.round(baseData.fiber * factor * 10) / 10
      : undefined,
    sugar: baseData.sugar
      ? Math.round(baseData.sugar * factor * 10) / 10
      : undefined,
    sodium: baseData.sodium
      ? Math.round(baseData.sodium * factor * 10) / 10
      : undefined,
    calcium: baseData.calcium
      ? Math.round(baseData.calcium * factor * 10) / 10
      : undefined,
    iron: baseData.iron
      ? Math.round(baseData.iron * factor * 10) / 10
      : undefined,
    vitaminC: baseData.vitaminC
      ? Math.round(baseData.vitaminC * factor * 10) / 10
      : undefined,
  };
}

/**
 * Calculate percent daily value for nutrients
 */
export function calculatePercentDV(nutrient: string, amount: number): number {
  const dailyValues: Record<string, number> = {
    calories: 2000,
    protein: 50,
    carbs: 300,
    fat: 65,
    fiber: 25,
    sodium: 2300,
    calcium: 1000,
    iron: 18,
    vitaminC: 90,
  };

  const dv = dailyValues[nutrient];
  return dv ? Math.round((amount / dv) * 100) : 0;
}
