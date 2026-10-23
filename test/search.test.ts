import { describe, it, expect, beforeAll } from "vitest";
import { buildSearchIndex, search } from "../src/lib/search/index";
import type { City, Country } from "../src/lib/geo/types";

function city(overrides: Partial<City>): City {
  return {
    id: 1,
    name: "Test City",
    ascii: "Test City",
    country: "US",
    admin1: null,
    lat: 0,
    lon: 0,
    tz: "UTC",
    pop: 1000,
    cap: false,
    aliases: [],
    ...overrides,
  };
}

function country(overrides: Partial<Country>): Country {
  return {
    code: "US",
    name: "United States",
    continent: "North America",
    timezones: ["America/New_York"],
    multiZone: true,
    capitalCityId: null,
    representativeCityIds: [],
    cityCount: 1,
    ...overrides,
  };
}

const cities: City[] = [
  city({ id: 1, name: "Springfield", ascii: "Springfield", country: "US", admin1: "Illinois", pop: 114000, cap: false }),
  city({ id: 2, name: "Springfield", ascii: "Springfield", country: "US", admin1: "Massachusetts", pop: 155000, cap: false }),
  city({ id: 3, name: "Springfield", ascii: "Springfield", country: "US", admin1: "Missouri", pop: 169000, cap: false }),
  city({ id: 4, name: "São Paulo", ascii: "Sao Paulo", country: "BR", admin1: "São Paulo", pop: 12_300_000, cap: false }),
  city({ id: 5, name: "Zürich", ascii: "Zurich", country: "CH", admin1: "Zurich", pop: 400_000, cap: false }),
  city({ id: 6, name: "Paris", ascii: "Paris", country: "FR", admin1: "Île-de-France", pop: 2_100_000, cap: true }),
  city({ id: 7, name: "Paris", ascii: "Paris", country: "US", admin1: "Texas", pop: 25_000, cap: false }),
  city({ id: 8, name: "New York City", ascii: "New York City", country: "US", admin1: "New York", pop: 8_300_000, cap: false, aliases: ["NYC", "NY"] }),
];

const countries: Country[] = [
  country({ code: "US", name: "United States" }),
  country({ code: "UM", name: "United States Minor Outlying Islands" }),
  country({ code: "GB", name: "United Kingdom", multiZone: false, timezones: ["Europe/London"] }),
  country({ code: "AE", name: "United Arab Emirates", multiZone: false, timezones: ["Asia/Dubai"] }),
];

beforeAll(() => {
  buildSearchIndex([...cities, cities[0]], countries);
});

describe("search", () => {
  it("is accent-insensitive", () => {
    const results = search("sao paulo");
    expect(results.some((r) => r.kind === "city" && r.city.id === 4)).toBe(true);

    const results2 = search("zurich");
    expect(results2.some((r) => r.kind === "city" && r.city.id === 5)).toBe(true);
  });

  it("is case-insensitive", () => {
    const results = search("PARIS");
    expect(results.some((r) => r.kind === "city" && r.city.id === 6)).toBe(true);
  });

  it("returns all duplicate-named cities, ranked by population", () => {
    const results = search("springfield").filter((r) => r.kind === "city") as { kind: "city"; city: City }[];
    const ids = results.map((r) => r.city.id);
    expect(ids).toContain(1);
    expect(ids).toContain(2);
    expect(ids).toContain(3);
    // Missouri (169k) should outrank Illinois (114k).
    expect(ids.indexOf(3)).toBeLessThan(ids.indexOf(1));
  });

  it("ranks the national capital ahead of a same-named smaller town", () => {
    const results = search("paris").filter((r) => r.kind === "city") as { kind: "city"; city: City }[];
    const ids = results.map((r) => r.city.id);
    expect(ids.indexOf(6)).toBeLessThan(ids.indexOf(7));
  });

  it("matches a common alias", () => {
    const results = search("NYC");
    expect(results.some((r) => r.kind === "city" && r.city.id === 8)).toBe(true);
  });

  it("matches a country acronym alias", () => {
    const results = search("UAE");
    expect(results.some((r) => r.kind === "country" && r.country.code === "AE")).toBe(true);
  });

  it("returns no results for nonsense queries", () => {
    const results = search("zzzxxqqnonexistentplace");
    expect(results.length).toBe(0);
  });

  it("returns nothing for an empty query", () => {
    expect(search("")).toEqual([]);
    expect(search("   ")).toEqual([]);
  });
});

describe("search relevance regressions", () => {
  it("places the exact United States country before a longer prefix country", () => {
    const results = search("United States");
    expect(results[0]).toMatchObject({ kind: "country", country: { code: "US" } });
    expect(results.some(result => result.kind === "country" && result.country.code === "UM")).toBe(true);
    expect(results.every(result => result.kind === "country")).toBe(true);
  });
  it("normalizes repeated whitespace in a country query", () => {
    expect(search("  united    states ")[0]).toMatchObject({ kind: "country", country: { code: "US" } });
  });
  it("deduplicates repeated source IDs without discarding separate same-named towns", () => {
    const results = search("springfield").filter(result => result.kind === "city");
    expect(results.map(result => result.city.id)).toHaveLength(3);
    expect(new Set(results.map(result => result.city.id)).size).toBe(3);
  });
  it("keeps typo correction available when no literal name matches", () => {
    expect(search("pariss").some(result => result.kind === "city" && result.city.id === 6)).toBe(true);
  });
});
