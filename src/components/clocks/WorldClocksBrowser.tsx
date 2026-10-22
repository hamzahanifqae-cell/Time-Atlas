import { useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { useGeoData } from "../../lib/hooks/useGeoData";
import { useSelectionAnnouncement } from "../../lib/hooks/useSelectionAnnouncement";
import { $selection, selectCity } from "../../stores/location";
import { $preferences, addSavedCity, initPreferences } from "../../stores/preferences";
import { startClock } from "../../stores/clock";
import SearchCombobox from "../search/SearchCombobox";
import HourFormatToggle from "../clock/HourFormatToggle";
import ClockCard from "../clock/ClockCard";
import ComparisonTray from "../clock/ComparisonTray";
import type { City, Country } from "../../lib/geo/types";

export default function WorldClocksBrowser() {
  const geo = useGeoData(true);
  const selection = useStore($selection);
  const { savedCityIds } = useStore($preferences);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  useEffect(() => {
    initPreferences();
    startClock();
  }, []);

  const countriesSorted = useMemo(
    () => [...geo.countries].sort((a, b) => a.name.localeCompare(b.name)),
    [geo.countries],
  );

  const citiesForActiveCountry = useMemo(() => {
    if (!activeCountry) return [];
    return geo.cities.filter((c) => c.country === activeCountry).sort((a, b) => b.pop - a.pop);
  }, [activeCountry, geo.cities]);

  const activeCountryData: Country | undefined = activeCountry
    ? geo.countriesByCode.get(activeCountry)
    : undefined;

  const selectedCity: City | undefined =
    selection?.type === "city" ? geo.citiesById.get(selection.id) : undefined;
  const selectedCountry: Country | undefined =
    selection?.type === "country" ? geo.countriesByCode.get(selection.code) : undefined;
  const announcement = useSelectionAnnouncement(selectedCity, selectedCountry);

  if (geo.status === "loading") {
    return <p className="text-sm text-paper-600">Loading the full city and country index…</p>;
  }
  if (geo.status === "error") {
    return (
      <p className="text-sm text-danger-400">
        Couldn't load location data ({geo.error}). Try reloading the page.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>

      <div className="rounded-2xl border border-navy-700 bg-navy-800/40 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchCombobox placeholder="Search for a city or country…" />
          <HourFormatToggle />
        </div>
      </div>

      {selectedCity && (
        <div>
          <ClockCard city={selectedCity} />
          <button
            type="button"
            onClick={() => addSavedCity(selectedCity.id)}
            disabled={savedCityIds.includes(selectedCity.id)}
            className="mt-3 rounded-md border border-cyan-600/50 bg-cyan-600/10 px-3 py-1.5 text-sm font-medium text-cyan-400 hover:bg-cyan-600/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savedCityIds.includes(selectedCity.id) ? "Already saved" : "Add to comparison"}
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Browse by country" className="rounded-2xl border border-navy-700 bg-navy-800/40 p-4">
          <h2 className="px-2 text-sm font-semibold text-paper-100">Browse by country</h2>
          <ul className="mt-2 max-h-[32rem] overflow-y-auto">
            {countriesSorted.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  onClick={() => setActiveCountry(country.code)}
                  aria-current={activeCountry === country.code ? "true" : undefined}
                  className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${
                    activeCountry === country.code
                      ? "bg-navy-700 text-paper-100"
                      : "text-paper-400 hover:bg-navy-700/50 hover:text-paper-100"
                  }`}
                >
                  {country.name}
                  {country.multiZone && (
                    <span className="ml-1.5 text-xs text-paper-600">({country.timezones.length} zones)</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="rounded-2xl border border-navy-700 bg-navy-800/40 p-4">
          {!activeCountryData ? (
            <p className="p-2 text-sm text-paper-600">
              Choose a country on the left to browse its cities, or use search above.
            </p>
          ) : (
            <>
              <h2 className="px-2 text-sm font-semibold text-paper-100">
                {activeCountryData.name}
                {activeCountryData.multiZone && (
                  <span className="ml-2 font-normal text-paper-600">
                    spans {activeCountryData.timezones.length} time zones
                  </span>
                )}
              </h2>
              {citiesForActiveCountry.length === 0 ? (
                <p className="p-2 text-sm text-paper-600">
                  No city in our dataset for this country — see the{" "}
                  <a href="/guide#coverage" className="underline hover:text-paper-400">
                    coverage notes
                  </a>
                  .
                </p>
              ) : (
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {citiesForActiveCountry.map((city) => (
                    <li key={city.id}>
                      <button
                        type="button"
                        onClick={() => selectCity(city.id)}
                        className="w-full rounded-lg text-left"
                        aria-label={`Show local time in ${city.name}`}
                      >
                        <ClockCard city={city} variant="compact" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <ComparisonTray citiesById={geo.citiesById} />
    </div>
  );
}
