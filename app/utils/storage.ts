import type { NutritionData } from "~/types/scale";

const STORAGE_KEY = "scale-ingredients";
const MAX_STORED_INGREDIENTS = 10;

/**
 * Save ingredients to localStorage
 */
export function saveIngredients(ingredients: NutritionData[]): void {
  try {
    // Keep only the most recent ingredients
    const toStore = ingredients.slice(-MAX_STORED_INGREDIENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.warn("Failed to save ingredients to localStorage:", error);
  }
}

/**
 * Load ingredients from localStorage
 */
export function loadIngredients(): NutritionData[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to load ingredients from localStorage:", error);
    return [];
  }
}

/**
 * Clear all stored ingredients
 */
export function clearStoredIngredients(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear stored ingredients:", error);
  }
}

/**
 * Add a new ingredient to stored ingredients
 */
export function addIngredient(newIngredient: NutritionData): NutritionData[] {
  const currentIngredients = loadIngredients();
  const updatedIngredients = [...currentIngredients, newIngredient];
  saveIngredients(updatedIngredients);
  return updatedIngredients.slice(-MAX_STORED_INGREDIENTS);
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
