import { useState, useEffect } from "react";
import type { ScaleReading } from "~/types/scale";
import { formatWeight } from "~/utils/scaleUtils";

interface IngredientFormProps {
  currentReading: ScaleReading | null;
  onConfirm: (ingredient: string, reading: ScaleReading) => void;
  className?: string;
  isLoading?: boolean;
}

export function IngredientForm({
  currentReading,
  onConfirm,
  className = "",
  isLoading = false,
}: IngredientFormProps) {
  const [ingredient, setIngredient] = useState("");
  const [canConfirm, setCanConfirm] = useState(false);

  // Check if we can confirm (stable reading + ingredient name)
  useEffect(() => {
    setCanConfirm(
      Boolean(
        currentReading?.isStable &&
          currentReading.weight > 0 &&
          ingredient.trim().length > 0
      )
    );
  }, [currentReading, ingredient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canConfirm && currentReading) {
      onConfirm(ingredient.trim(), currentReading);
      setIngredient(""); // Clear form after confirmation
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canConfirm && currentReading) {
      handleSubmit(e);
    }
    // Right arrow key as alternative confirm
    if (e.key === "ArrowRight" && canConfirm && currentReading) {
      handleSubmit(e);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Add Ingredient</h3>

      {/* Current Weight Display */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-sm text-gray-600 mb-1">Current Weight</div>
        <div className="text-2xl font-bold text-gray-900">
          {currentReading?.isStable
            ? formatWeight(currentReading.weight, currentReading.unit)
            : "-- --"}
        </div>
        {currentReading && !currentReading.isStable && (
          <div className="text-xs text-yellow-600 mt-1">
            Place item on scale and wait for stable reading
          </div>
        )}
      </div>

      {/* Ingredient Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="ingredient"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Ingredient Name
          </label>
          <input
            id="ingredient"
            type="text"
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., apple, chicken breast, rice..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!canConfirm || isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
            canConfirm && !isLoading
              ? "bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transform hover:scale-[1.02]"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Getting nutrition data...</span>
            </div>
          ) : (
            "Confirm Ingredient"
          )}
        </button>
      </form>

      {/* Keyboard Shortcuts */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
        <strong>Shortcuts:</strong> Press Enter or → to confirm when ready
      </div>
    </div>
  );
}
