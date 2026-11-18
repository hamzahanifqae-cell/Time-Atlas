import type { City, Country } from "./types";
import type { FeatureCollection, Geometry } from "geojson";
import type { CountryBoundaryProperties } from "./types";

export type BoundaryCollection = FeatureCollection<Geometry, CountryBoundaryProperties>;

let citiesPromise: Promise<City[]> | null = null;
let countriesPromise: Promise<Country[]> | null = null;
let boundariesPromise: Promise<BoundaryCollection> | null = null;
let cityByIdIndex: Map<number, City> | null = null;
let countryByCodeIndex: Map<string, Country> | null = null;

/** Clears in-flight dataset promises so a retry can start a new fetch after a timeout. */
export function resetGeoLoadCaches() {
  citiesPromise = null;
  countriesPromise = null;
  boundariesPromise = null;
  cityByIdIndex = null;
  countryByCodeIndex = null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

/** Fetches (once, cached) the city index. ~2.6MB uncompressed — call this lazily. */
export function getCities(): Promise<City[]> {
  if (!citiesPromise) {
    citiesPromise = fetchJson<City[]>("/data/cities.json").catch((err) => {
      citiesPromise = null;
      throw err;
    });
  }
  return citiesPromise;
}

export function getCountries(): Promise<Country[]> {
  if (!countriesPromise) {
    countriesPromise = fetchJson<Country[]>("/data/countries.json").catch((err) => {
      countriesPromise = null;
      throw err;
    });
  }
  return countriesPromise;
}

/** Fetches (once, cached) simplified country boundary polygons for the globe/2D map. */
export function getBoundaries(): Promise<BoundaryCollection> {
  if (!boundariesPromise) {
    boundariesPromise = fetchJson<BoundaryCollection>("/data/boundaries.geojson").catch((err) => {
      boundariesPromise = null;
      throw err;
    });
  }
  return boundariesPromise;
}

export async function getCityById(id: number): Promise<City | undefined> {
  if (!cityByIdIndex) {
    const cities = await getCities();
    cityByIdIndex = new Map(cities.map((c) => [c.id, c]));
  }
  return cityByIdIndex.get(id);
}

export async function getCountryByCode(code: string): Promise<Country | undefined> {
  if (!countryByCodeIndex) {
    const countries = await getCountries();
    countryByCodeIndex = new Map(countries.map((c) => [c.code, c]));
  }
  return countryByCodeIndex.get(code);
}
