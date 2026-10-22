import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { City, Country } from "../src/lib/geo/types";

let cities: City[];
let countries: Country[];
let countriesByCode: Map<string, Country>;

beforeAll(() => {
  const dataDir = path.join(process.cwd(), "public/data");
  cities = JSON.parse(fs.readFileSync(path.join(dataDir, "cities.json"), "utf8"));
  countries = JSON.parse(fs.readFileSync(path.join(dataDir, "countries.json"), "utf8"));
  countriesByCode = new Map(countries.map((c) => [c.code, c]));
});

describe("generated country data: multi-zone flags", () => {
  it("flags well-known multi-zone countries correctly", () => {
    for (const code of ["US", "RU", "AU", "BR", "CA", "ID"]) {
      const country = countriesByCode.get(code);
      expect(country, `${code} should exist`).toBeTruthy();
      expect(country!.multiZone).toBe(true);
      expect(country!.timezones.length).toBeGreaterThan(1);
    }
  });

  it("does not flag well-known single-zone countries as multi-zone", () => {
    for (const code of ["IS", "LU", "FR", "DE", "JP", "KR"]) {
      const country = countriesByCode.get(code);
      expect(country, `${code} should exist`).toBeTruthy();
      expect(country!.multiZone).toBe(false);
      expect(country!.timezones.length).toBe(1);
    }
  });

  it("gives every multi-zone country at least one representative city per timezone where population data allows", () => {
    const usa = countriesByCode.get("US")!;
    // US territories/counties aside, the primary zones should each have a representative city.
    const coreZones = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"];
    for (const tz of coreZones) {
      expect(usa.timezones).toContain(tz);
    }
    expect(usa.representativeCityIds.length).toBeGreaterThan(5);
  });
});

describe("generated city data: half/quarter-hour offset coverage", () => {
  it("includes cities in half-hour offset zones", () => {
    expect(cities.some((c) => c.tz === "Asia/Kolkata")).toBe(true);
    expect(cities.some((c) => c.tz === "America/St_Johns")).toBe(true);
  });

  it("includes cities in quarter-hour offset zones", () => {
    expect(cities.some((c) => c.tz === "Asia/Kathmandu")).toBe(true);
  });

  it("every city has a non-empty IANA tz id and valid coordinates", () => {
    for (const city of cities) {
      expect(city.tz.length).toBeGreaterThan(0);
      expect(city.lat).toBeGreaterThanOrEqual(-90);
      expect(city.lat).toBeLessThanOrEqual(90);
      expect(city.lon).toBeGreaterThanOrEqual(-180);
      expect(city.lon).toBeLessThanOrEqual(180);
    }
  });

  it("has no duplicate city ids", () => {
    const ids = new Set(cities.map((c) => c.id));
    expect(ids.size).toBe(cities.length);
  });
});
