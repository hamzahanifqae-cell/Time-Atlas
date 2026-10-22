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
  country({ code: "GB", name: "United Kingdom", multiZone: false, timezones: ["Europe/London"] }),
  country({ code: "AE", name: "United Arab Emirates", multiZone: false, timezones: ["Asia/Dubai"] }),
];

beforeAll(() => {
  buildSearchIndex(cities, countries);
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
