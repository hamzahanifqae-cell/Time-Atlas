import { useState } from "react";
import { useStore } from "@nanostores/react";
import {
  $preferences,
  $storageWarning,
  addSavedCity,
  removeSavedCity,
  clearSavedCities,
  MAX_SAVED_CITIES,
} from "../../stores/preferences";
import { $selection } from "../../stores/location";
import ClockCard from "./ClockCard";
import type { City } from "../../lib/geo/types";

interface ComparisonTrayProps {
  citiesById: Map<number, City>;
}

export default function ComparisonTray({ citiesById }: ComparisonTrayProps) {
  const { savedCityIds } = useStore($preferences);
  const selection = useStore($selection);
  const storageWarning = useStore($storageWarning);
  const [feedback, setFeedback] = useState<string | null>(null);

  const savedCities = savedCityIds
    .map((id) => citiesById.get(id))
    .filter((c): c is City => c !== undefined);

  const selectedCity = selection?.type === "city" ? citiesById.get(selection.id) : undefined;
  const canAddSelected = selectedCity && !savedCityIds.includes(selectedCity.id);

  function handleAdd() {
    if (!selectedCity) return;
    const result = addSavedCity(selectedCity.id);
    if (result === "full") {
      setFeedback(`You can save up to ${MAX_SAVED_CITIES} cities. Remove one to add another.`);
    } else if (result === "added") {
      setFeedback(null);
    }
  }

  return (
    <section aria-labelledby="comparison-heading" className="rounded-2xl border border-navy-700 bg-navy-800/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="comparison-heading" className="text-lg font-semibold text-paper-100">
          Compare cities
        </h2>
        <div className="flex items-center gap-2">
          {selectedCity && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAddSelected}
              className="rounded-md border border-cyan-600/50 bg-cyan-600/10 px-3 py-1.5 text-sm font-medium text-cyan-400 hover:bg-cyan-600/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canAddSelected ? `Add ${selectedCity.name}` : "Already saved"}
            </button>
          )}
          {savedCities.length > 0 && (
            <button
              type="button"
              onClick={() => {
                clearSavedCities();
                setFeedback(null);
              }}
              className="rounded-md border border-navy-600 px-3 py-1.5 text-sm text-paper-400 hover:text-paper-100"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <p className="mt-1 text-sm text-paper-600">
        Saved locally in this browser — up to {MAX_SAVED_CITIES} cities.
      </p>

      {feedback && (
        <p role="status" className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
          {feedback}
        </p>
      )}
      {storageWarning && (
        <p role="alert" className="mt-3 rounded-md bg-danger-500/10 px-3 py-2 text-sm text-danger-400">
          {storageWarning}
        </p>
      )}

      {savedCities.length === 0 ? (
        <p className="mt-4 text-sm text-paper-600">
          No cities saved yet. Search for a city above, then add it here to compare times side by side.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {savedCities.map((city) => (
            <li key={city.id}>
              <ClockCard city={city} variant="compact" onRemove={() => removeSavedCity(city.id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
