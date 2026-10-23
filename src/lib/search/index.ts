import Fuse from "fuse.js";
import type { City, Country } from "../geo/types";
import { normalize } from "./normalize";
import { COUNTRY_ALIASES } from "./countryAliases";

export interface CitySearchResult { kind: "city"; city: City }
export interface CountrySearchResult { kind: "country"; country: Country }
export type SearchResult = CitySearchResult | CountrySearchResult;
interface IndexedItem {
  result: SearchResult;
  primary: string;
  names: string[];
  context: string;
  pop: number;
  capital: boolean;
}
let items: IndexedItem[] = [];
let fuse: Fuse<IndexedItem> | null = null;

export function buildSearchIndex(cities: City[], countries: Country[]): void {
  const countryNames = new Map(countries.map(country => [country.code, country.name]));
  items = [
    ...[...new Map(cities.map(city => [city.id, city])).values()].map(city => ({
      result: { kind: "city" as const, city },
      primary: normalize(city.name),
      names: [...new Set([city.name, city.ascii, ...city.aliases].map(normalize))].filter(Boolean),
      context: normalize([city.name, city.admin1 ?? "", countryNames.get(city.country) ?? city.country].join(" ")),
      pop: city.pop,
      capital: city.cap,
    })),
    ...countries.map(country => ({
      result: { kind: "country" as const, country },
      primary: normalize(country.name),
      names: [country.name, country.code, ...(COUNTRY_ALIASES[country.code] ?? [])].map(normalize),
      context: normalize(country.name), pop: 0, capital: false,
    })),
  ];
  fuse = new Fuse(items, { keys: ["names"], threshold: 0.25, ignoreLocation: true, includeScore: true, minMatchCharLength: 2 });
}
export function isSearchIndexReady(): boolean { return fuse !== null; }

/** Exact names/aliases and literal matches always precede typo correction. When literal
 * matches exist, don't fill the menu with unrelated fuzzy results. */
export function search(query: string, limit = 8): SearchResult[] {
  const q = normalize(query);
  if (!fuse || !q || limit <= 0) return [];
  function matchTier(item: IndexedItem): number {
    if (item.primary === q) return 0;
    if (item.names.includes(q)) return 1;
    if (item.primary.startsWith(q)) return 2;
    if (item.names.some(name => name.startsWith(q))) return 3;
    if (item.names.some(name => name.includes(q))) return 4;
    if (item.context.includes(q)) return 5;
    return Infinity;
  }
  const literal = items.map(item => ({ item, tier: matchTier(item) })).filter(entry => Number.isFinite(entry.tier));
  const exactCountry = literal.some(entry => entry.item.result.kind === "country" && entry.tier <= 1);
  const relevant = exactCountry ? literal.filter(entry => entry.item.result.kind === "country" || entry.tier < 5) : literal;
  const rankImportance = (a: IndexedItem, b: IndexedItem) => Number(b.capital) - Number(a.capital) || b.pop - a.pop || a.primary.localeCompare(b.primary);
  if (relevant.length) return relevant.sort((a, b) => a.tier - b.tier || rankImportance(a.item, b.item)).slice(0, limit).map(entry => entry.item.result);
  if (q.length < 3) return [];
  return fuse.search(q, { limit: Math.max(24, limit * 3) })
    .filter(result => (result.score ?? 1) <= 0.25)
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1) || rankImportance(a.item, b.item))
    .slice(0, limit).map(result => result.item.result);
}
