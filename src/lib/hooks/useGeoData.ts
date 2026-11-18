import { useEffect, useState } from "react";
import { getCities, getCountries, resetGeoLoadCaches } from "../geo/load";
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

/** Slow networks should not leave the clocks index on a permanent loading message. */
export const GEO_DATA_LOAD_TIMEOUT_MS = 20_000;

let loadTimeoutMs = GEO_DATA_LOAD_TIMEOUT_MS;

const emptyState = (): Omit<GeoDataState, "status" | "error"> => ({
  cities: [],
  countries: [],
  citiesById: new Map(),
  countriesByCode: new Map(),
});

let sharedState: GeoDataState | null = null;
let sharedPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

function load(force = false) {
  if (sharedPromise && !force) return sharedPromise;
  if (sharedState?.status === "ready" && !force) {
    return Promise.resolve();
  }

  sharedState = {
    status: "loading",
    ...emptyState(),
    error: null,
  };
  notify();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Timed out loading the city and country index"));
    }, loadTimeoutMs);
  });

  const request = Promise.all([getCities(), getCountries()]);

  sharedPromise = Promise.race([request, timeout])
    .then(([cities, countries]) => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
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
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      // Clear so Retry can start a new request. A timeout must also drop the
      // in-flight getCities/getCountries promises, or retry would wait on the same hang.
      sharedPromise = null;
      resetGeoLoadCaches();
      sharedState = {
        status: "error",
        ...emptyState(),
        error: err instanceof Error ? err.message : "Failed to load location data",
      };
      notify();
    });

  return sharedPromise;
}

/** Lazily loads (once, shared across all component instances) the city/country datasets and
 *  builds the search index. Call `trigger()` from an interaction (e.g. search focus) rather
 *  than eagerly on mount if you want to defer the ~1MB+ download. */
export function useGeoData(autoLoad: boolean): GeoDataState & {
  trigger: () => void;
  retry: () => void;
} {
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
    trigger: () => {
      void load(false);
    },
    retry: () => {
      void load(true);
    },
  };
}

/** Test-only: clear the shared cache between cases. */
export function resetGeoDataForTests() {
  sharedState = null;
  sharedPromise = null;
  loadTimeoutMs = GEO_DATA_LOAD_TIMEOUT_MS;
}

/** Test-only: shorten the load timeout. */
export function setGeoDataLoadTimeoutForTests(ms: number) {
  loadTimeoutMs = ms;
}
