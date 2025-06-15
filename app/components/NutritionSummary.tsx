import { useState, useEffect } from "react";
import type { NutritionData, NutritionSummary } from "~/types/scale";
import { calculatePercentDV } from "~/utils/nutritionApi";

interface NutritionSummaryProps {
  ingredients: NutritionData[];
  className?: string;
}

interface NutrientBar {
  name: string;
  value: number;
  unit: string;
  percentDV: number;
  color: string;
}

export function NutritionSummary({
  ingredients,
  className = "",
}: NutritionSummaryProps) {
  const [animatedBars, setAnimatedBars] = useState<Record<string, number>>({});

  // Calculate totals
  const summary: NutritionSummary = ingredients.reduce(
    (acc, ingredient) => ({
      totalCalories: acc.totalCalories + ingredient.calories,
      totalProtein: acc.totalProtein + ingredient.protein,
      totalCarbs: acc.totalCarbs + ingredient.carbs,
      totalFat: acc.totalFat + ingredient.fat,
      totalFiber: acc.totalFiber + (ingredient.fiber || 0),
      ingredients: [...acc.ingredients, ingredient],
    }),
    {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      ingredients: [],
    } as NutritionSummary
  );

  // Create nutrient bars data
  const nutrientBars: NutrientBar[] = [
    {
      name: "Calories",
      value: summary.totalCalories,
      unit: "kcal",
      percentDV: calculatePercentDV("calories", summary.totalCalories),
      color: "bg-red-500",
    },
    {
      name: "Protein",
      value: summary.totalProtein,
      unit: "g",
      percentDV: calculatePercentDV("protein", summary.totalProtein),
      color: "bg-blue-500",
    },
    {
      name: "Carbs",
      value: summary.totalCarbs,
      unit: "g",
      percentDV: calculatePercentDV("carbs", summary.totalCarbs),
      color: "bg-yellow-500",
    },
    {
      name: "Fat",
      value: summary.totalFat,
      unit: "g",
      percentDV: calculatePercentDV("fat", summary.totalFat),
      color: "bg-purple-500",
    },
    {
      name: "Fiber",
      value: summary.totalFiber,
      unit: "g",
      percentDV: calculatePercentDV("fiber", summary.totalFiber),
      color: "bg-green-500",
    },
  ];

  // Animate bars on mount and when values change
  useEffect(() => {
    const timer = setTimeout(() => {
      const newAnimatedBars: Record<string, number> = {};
      nutrientBars.forEach((bar) => {
        newAnimatedBars[bar.name] = Math.min(bar.percentDV, 100);
      });
      setAnimatedBars(newAnimatedBars);
    }, 100);

    return () => clearTimeout(timer);
  }, [ingredients]);

  if (ingredients.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Nutrition Summary
        </h3>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🥗</div>
          <p>Add ingredients to see nutrition information</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Nutrition Summary
        </h3>
        <div className="text-sm text-gray-600">
          {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Macronutrient Bars */}
      <div className="space-y-4">
        {nutrientBars.map((bar) => (
          <div key={bar.name} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {bar.name}
              </span>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  {bar.value.toFixed(bar.name === "Calories" ? 0 : 1)}{" "}
                  {bar.unit}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {bar.percentDV}% DV
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-out ${
                  bar.color
                } ${bar.percentDV > 100 ? "animate-pulse" : ""}`}
                style={{
                  width: `${animatedBars[bar.name] || 0}%`,
                  transform: animatedBars[bar.name] ? "scale(1)" : "scale(0)",
                  transformOrigin: "left center",
                }}
              />
              {/* Overflow indicator */}
              {bar.percentDV > 100 && (
                <div className="absolute right-0 top-0 h-full w-1 bg-red-600 animate-pulse" />
              )}
            </div>

            {/* 100% DV marker */}
            <div className="relative">
              <div
                className="absolute top-0 w-px h-2 bg-gray-400"
                style={{ left: "100%" }}
              />
              <div className="text-xs text-gray-400 text-right">100% DV</div>
            </div>
          </div>
        ))}
      </div>

      {/* Ingredients List */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Ingredients Added
        </h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {ingredients.map((ingredient, index) => (
            <div
              key={`${ingredient.ingredient}-${index}`}
              className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.5s ease-out forwards",
              }}
            >
              <div className="flex-1">
                <span className="font-medium text-gray-900 capitalize">
                  {ingredient.ingredient}
                </span>
                <span className="text-gray-600 ml-2">
                  ({ingredient.weight}g)
                </span>
              </div>
              <div className="text-right text-gray-700">
                <div>{ingredient.calories} cal</div>
                <div className="text-xs text-gray-500">
                  P: {ingredient.protein}g | C: {ingredient.carbs}g | F:{" "}
                  {ingredient.fat}g
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Value Note */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
        <strong>Note:</strong> Percent Daily Values are based on a 2,000 calorie
        diet. Values over 100% indicate you've exceeded the recommended daily
        amount.
      </div>
    </div>
  );
}

// CSS for fadeInUp animation (to be added to global styles)
const fadeInUpStyle = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Export the CSS for inclusion in the app
export { fadeInUpStyle };
