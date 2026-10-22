import Fuse from "fuse.js";
import type { City, Country } from "../geo/types";
import { normalize } from "./normalize";
import { COUNTRY_ALIASES } from "./countryAliases";

export interface CitySearchResult {
  kind: "city";
  city: City;
}
export interface CountrySearchResult {
  kind: "country";
  country: Country;
}
export type SearchResult = CitySearchResult | CountrySearchResult;

interface IndexedCity {
  kind: "city";
  norm: string;
  pop: number;
  cap: boolean;
  city: City;
}
interface IndexedCountry {
  kind: "country";
  norm: string;
  pop: number;
  cap: boolean;
  country: Country;
}
type IndexedItem = IndexedCity | IndexedCountry;

let fuse: Fuse<IndexedItem> | null = null;

export function buildSearchIndex(cities: City[], countries: Country[]): void {
  const items: IndexedItem[] = [];

  for (const city of cities) {
    const parts = [city.ascii, city.name, ...city.aliases, city.admin1 ?? "", city.country];
    items.push({
      kind: "city",
      norm: normalize(parts.join(" ")),
      pop: city.pop,
      cap: city.cap,
      city,
    });
  }

  for (const country of countries) {
    const aliasParts = COUNTRY_ALIASES[country.code] ?? [];
    items.push({
      kind: "country",
      norm: normalize([country.name, ...aliasParts].join(" ")),
      pop: 0,
      cap: false,
      country,
    });
  }

  fuse = new Fuse(items, {
    keys: ["norm"],
    threshold: 0.32,
    ignoreLocation: true,
    includeScore: true,
    minMatchCharLength: 1,
  });
}

export function isSearchIndexReady(): boolean {
  return fuse !== null;
}

/**
 * Ranks by fuzzy-match quality first, then boosts exact prefix matches, national capitals,
 * and larger population — so typing "london" surfaces London, UK ahead of smaller towns
 * that happen to share letters, and "paris" doesn't bury the capital under Paris, Texas.
 */
export function search(query: string, limit = 8): SearchResult[] {
  if (!fuse) return [];
  const q = normalize(query);
  if (!q) return [];

  const rawResults = fuse.search(q, { limit: Math.max(limit * 4, 24) });

  const ranked = rawResults
    .map((r) => {
      const item = r.item;
      const fuseScore = r.score ?? 1;
      const prefixBonus = item.norm.startsWith(q) ? -0.5 : 0;
      const capBonus = item.cap ? -0.05 : 0;
      const popBonus = item.pop > 0 ? -Math.min(0.2, Math.log10(item.pop + 1) / 100) : 0;
      return { item, rank: fuseScore + prefixBonus + capBonus + popBonus };
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit);

  return ranked.map(({ item }) =>
    item.kind === "city" ? { kind: "city", city: item.city } : { kind: "country", country: item.country },
  );
}
