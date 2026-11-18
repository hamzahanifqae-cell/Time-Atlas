import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  resetGeoDataForTests,
  setGeoDataLoadTimeoutForTests,
  useGeoData,
} from "../src/lib/hooks/useGeoData";
import type { City, Country } from "../src/lib/geo/types";

vi.mock("../src/lib/geo/load", () => ({
  getCities: vi.fn(),
  getCountries: vi.fn(),
  resetGeoLoadCaches: vi.fn(),
}));

vi.mock("../src/lib/search/index", () => ({
  buildSearchIndex: vi.fn(),
}));

import { getCities, getCountries } from "../src/lib/geo/load";

const getCitiesMock = vi.mocked(getCities);
const getCountriesMock = vi.mocked(getCountries);

const sampleCity = {
  id: 1,
  name: "Test City",
  ascii: "Test City",
  country: "TC",
  admin1: null,
  lat: 0,
  lon: 0,
  tz: "UTC",
  pop: 1,
  cap: false,
  aliases: [],
} satisfies City;

const sampleCountry = {
  code: "TC",
  name: "Test Country",
  continent: "AS",
  timezones: ["UTC"],
  multiZone: false,
  capitalCityId: 1,
  representativeCityIds: [1],
  cityCount: 1,
} satisfies Country;

describe("useGeoData", () => {
  beforeEach(() => {
    resetGeoDataForTests();
    getCitiesMock.mockReset();
    getCountriesMock.mockReset();
  });

  afterEach(() => {
    resetGeoDataForTests();
  });

  it("exposes an error with retry after the load times out", async () => {
    setGeoDataLoadTimeoutForTests(30);
    getCitiesMock.mockImplementation(() => new Promise(() => {}));
    getCountriesMock.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useGeoData(true));
    expect(result.current.status).toBe("loading");

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toMatch(/timed out/i);

    getCitiesMock.mockResolvedValue([sampleCity]);
    getCountriesMock.mockResolvedValue([sampleCountry]);

    await act(async () => {
      result.current.retry();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.cities).toHaveLength(1);
    expect(result.current.countries).toHaveLength(1);
  });

  it("clears a failed load so retry can fetch again", async () => {
    getCitiesMock.mockRejectedValueOnce(new Error("Failed to load /data/cities.json: 500"));
    getCountriesMock.mockResolvedValue([]);

    const { result } = renderHook(() => useGeoData(true));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toMatch(/cities\.json/);

    getCitiesMock.mockResolvedValue([]);
    getCountriesMock.mockResolvedValue([]);

    await act(async () => {
      result.current.retry();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe("ready");
  });
});
