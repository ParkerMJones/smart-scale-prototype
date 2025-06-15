import { useState, useEffect } from "react";
import type { MetaFunction } from "@remix-run/node";
import type { ScaleReading, NutritionData } from "~/types/scale";
import { ScaleConnector } from "~/components/ScaleConnector";
import { IngredientForm } from "~/components/IngredientForm";
import { NutritionSummary } from "~/components/NutritionSummary";
import { getNutritionData } from "~/utils/nutritionApi";

export const meta: MetaFunction = () => {
  return [
    { title: "Smart Scale - Nutrition Tracker" },
    {
      name: "description",
      content: "Track nutrition with your Etekcity smart food scale",
    },
  ];
};

// Fallback component for SSR
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Smart Scale Nutrition Tracker
          </h1>
          <p className="text-gray-600">Loading Bluetooth interface...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaleApp() {
  const [currentReading, setCurrentReading] = useState<ScaleReading | null>(
    null
  );
  const [ingredients, setIngredients] = useState<NutritionData[]>([]);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    const stored = localStorage.getItem("scale-ingredients");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setIngredients(parsed);
        }
      } catch (error) {
        console.warn("Failed to parse stored ingredients:", error);
      }
    }
  }, []);

  // Persist data to localStorage
  useEffect(() => {
    if (ingredients.length > 0) {
      localStorage.setItem("scale-ingredients", JSON.stringify(ingredients));
    }
  }, [ingredients]);

  // Handle stable scale readings
  const handleStableReading = (reading: ScaleReading) => {
    setCurrentReading(reading);
  };

  // Handle ingredient confirmation
  const handleIngredientConfirm = async (
    ingredientName: string,
    reading: ScaleReading
  ) => {
    setIsLoadingNutrition(true);

    try {
      const nutritionData = await getNutritionData(
        ingredientName,
        reading.weight,
        reading.unit
      );

      setIngredients((prev) => {
        const newIngredients = [...prev, nutritionData];
        // Keep only last 10 ingredients to prevent excessive storage
        return newIngredients.slice(-10);
      });

      // Clear current reading after successful addition
      setCurrentReading(null);
    } catch (error) {
      console.error("Failed to get nutrition data:", error);
      // TODO: Show error toast/notification
    } finally {
      setIsLoadingNutrition(false);
    }
  };

  // Clear all ingredients
  const handleClearAll = () => {
    setIngredients([]);
    localStorage.removeItem("scale-ingredients");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Smart Scale Nutrition Tracker
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect your Etekcity ESN00 smart scale to track nutrition
            information for your ingredients. Place items on the scale, wait for
            a stable reading, then enter the ingredient name.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Scale & Input */}
          <div className="space-y-6">
            <ScaleConnector
              onStableReading={handleStableReading}
              className="w-full"
            />

            <IngredientForm
              currentReading={currentReading}
              onConfirm={handleIngredientConfirm}
              isLoading={isLoadingNutrition}
              className="w-full"
            />

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>
                  Click &quot;Connect to Scale&quot; and select your Etekcity
                  device
                </li>
                <li>Place an ingredient on the scale</li>
                <li>Wait for the reading to stabilize (green indicator)</li>
                <li>
                  Type the ingredient name and press Enter or click Confirm
                </li>
                <li>View nutrition information in the summary panel</li>
              </ol>
            </div>
          </div>

          {/* Right Column - Nutrition Summary */}
          <div className="space-y-6">
            <NutritionSummary ingredients={ingredients} className="w-full" />

            {/* Actions */}
            {ingredients.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Data is automatically saved locally
                  </span>
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Compatible with Etekcity ESN00 smart scales. Requires Chrome/Edge
            browser with Web Bluetooth support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [isClient, setIsClient] = useState(false);

  // Simple client-side detection to avoid SSR issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <LoadingFallback />;
  }

  return <ScaleApp />;
}
