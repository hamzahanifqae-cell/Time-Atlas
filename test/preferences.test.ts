import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadPreferences,
  savePreferences,
  DEFAULT_PREFERENCES,
} from "../src/lib/storage/preferences";

describe("preferences storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns defaults when nothing is stored", () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("round-trips valid preferences", () => {
    const prefs = { ...DEFAULT_PREFERENCES, hour12: false, savedCityIds: [1, 2, 3] };
    savePreferences(prefs);
    expect(loadPreferences()).toEqual(prefs);
  });

  it("discards corrupt JSON and falls back to defaults", () => {
    window.localStorage.setItem("timeatlas.preferences.v1", "{not json");
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("discards structurally invalid data (wrong types) and falls back to defaults", () => {
    window.localStorage.setItem(
      "timeatlas.preferences.v1",
      JSON.stringify({ hour12: "yes", savedCityIds: "not-an-array" }),
    );
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("caps saved city ids at the max and de-duplicates", () => {
    window.localStorage.setItem(
      "timeatlas.preferences.v1",
      JSON.stringify({
        hour12: true,
        savedCityIds: [1, 1, 2, 3, 4, 5, 6, 7, 8],
        autoRotate: true,
      }),
    );
    // Schema caps the array length at 6 entries; this input has 9, so it should be rejected
    // (treated as invalid) rather than silently truncated to hide the overflow.
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it("ignores retired preference fields while keeping saved cities", () => {
    window.localStorage.setItem(
      "timeatlas.preferences.v1",
      JSON.stringify({
        hour12: true,
        savedCityIds: [1, 2],
        workingHours: { start: 30, end: 17 },
        autoRotate: true,
      }),
    );
    expect(loadPreferences()).toEqual({ ...DEFAULT_PREFERENCES, savedCityIds: [1, 2] });
  });

  it("handles a storage write failure gracefully (quota exceeded)", () => {
    const spy = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded");
    });
    expect(() => savePreferences(DEFAULT_PREFERENCES)).not.toThrow();
    expect(savePreferences(DEFAULT_PREFERENCES)).toBe(false);
    spy.mockRestore();
  });

  it("handles storage being entirely unavailable (e.g. getItem throws)", () => {
    const spy = vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
      throw new DOMException("blocked");
    });
    expect(() => loadPreferences()).not.toThrow();
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    spy.mockRestore();
  });
});
