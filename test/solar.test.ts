import { describe, it, expect } from "vitest";
import { getSubsolarPoint } from "../src/lib/time/solar";

describe("getSubsolarPoint", () => {
  it("places the subsolar point near the Tropic of Capricorn at the December solstice", () => {
    const ms = Date.UTC(2026, 11, 22, 0, 0, 0);
    const { lat } = getSubsolarPoint(ms);
    expect(lat).toBeLessThan(-23);
    expect(lat).toBeGreaterThan(-23.8);
  });

  it("places the subsolar point near the Tropic of Cancer at the June solstice", () => {
    const ms = Date.UTC(2026, 5, 21, 12, 0, 0);
    const { lat } = getSubsolarPoint(ms);
    expect(lat).toBeGreaterThan(23);
    expect(lat).toBeLessThan(23.8);
  });

  it("places the subsolar point near the equator at an equinox", () => {
    const ms = Date.UTC(2026, 2, 20, 12, 0, 0);
    const { lat } = getSubsolarPoint(ms);
    expect(Math.abs(lat)).toBeLessThan(1.5);
  });

  it("keeps longitude within [-180, 180]", () => {
    for (let h = 0; h < 24; h++) {
      const { lon } = getSubsolarPoint(Date.UTC(2026, 5, 15, h));
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThanOrEqual(180);
    }
  });

  it("subsolar longitude tracks roughly opposite local noon around the globe", () => {
    // At 00:00 UTC it should be roughly solar midnight at longitude 0 => subsolar point
    // should be near longitude 180 (give or take the equation of time, a few degrees).
    const { lon } = getSubsolarPoint(Date.UTC(2026, 2, 20, 0, 0, 0));
    expect(Math.abs(Math.abs(lon) - 180)).toBeLessThan(5);
  });
});
