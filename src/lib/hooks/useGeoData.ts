import { useEffect, useState } from "react";
import { getCities, getCountries } from "../geo/load";
import { buildSearchIndex } from "../search/index";
import type { City, Country } from "../geo/types";

export interface GeoDataState {
  status: "loading" | "ready" | "error";
  cities: City[];
  countries: Country[];
  citiesById: Map<number, City>;
  countriesByCode: Map<string, Country>;
  error: string | null;
}

let sharedState: GeoDataState | null = null;
let sharedPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function load() {
  if (sharedPromise) return sharedPromise;
  sharedPromise = Promise.all([getCities(), getCountries()])
    .then(([cities, countries]) => {
      buildSearchIndex(cities, countries);
      sharedState = {
        status: "ready",
        cities,
        countries,
        citiesById: new Map(cities.map((c) => [c.id, c])),
        countriesByCode: new Map(countries.map((c) => [c.code, c])),
        error: null,
      };
      notify();
    })
    .catch((err) => {
      sharedState = {
        status: "error",
        cities: [],
        countries: [],
        citiesById: new Map(),
        countriesByCode: new Map(),
        error: err instanceof Error ? err.message : "Failed to load location data",
      };
      notify();
    });
  return sharedPromise;
}

/** Lazily loads (once, shared across all component instances) the city/country datasets and
 *  builds the search index. Call `trigger()` from an interaction (e.g. search focus) rather
 *  than eagerly on mount if you want to defer the ~1MB+ download. */
export function useGeoData(autoLoad: boolean): GeoDataState & { trigger: () => void } {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad]);

  return {
    status: sharedState?.status ?? "loading",
    cities: sharedState?.cities ?? [],
    countries: sharedState?.countries ?? [],
    citiesById: sharedState?.citiesById ?? new Map(),
    countriesByCode: sharedState?.countriesByCode ?? new Map(),
    error: sharedState?.error ?? null,
    trigger: load,
  };
}
