import { describe, it, expect } from "vitest";
import { latLonToVector3, vector3ToLatLon } from "../src/lib/geo/sphere";

describe("latLonToVector3", () => {
  it("places the north pole at +Y", () => {
    const p = latLonToVector3(90, 0, 1);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.y).toBeCloseTo(1, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });

  it("places the south pole at -Y", () => {
    const p = latLonToVector3(-90, 0, 1);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.y).toBeCloseTo(-1, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });

  it("places (0,0) (Gulf of Guinea / Null Island) on the equatorial plane", () => {
    const p = latLonToVector3(0, 0, 1);
    expect(p.y).toBeCloseTo(0, 5);
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(1, 5);
  });

  it("scales with radius", () => {
    const p = latLonToVector3(90, 0, 5);
    expect(p.y).toBeCloseTo(5, 5);
  });
});

describe("vector3ToLatLon (inverse of latLonToVector3)", () => {
  const samples: Array<[number, number]> = [
    [0, 0],
    [45, 90],
    [-33, -70],
    [89, 179],
    [-10, -150],
    [0, 180],
  ];

  for (const [lat, lon] of samples) {
    it(`round-trips (${lat}, ${lon})`, () => {
      const v = latLonToVector3(lat, lon, 1);
      const back = vector3ToLatLon(v, 1);
      expect(back.lat).toBeCloseTo(lat, 4);
      // Longitude wraps at +/-180 (e.g. 180 and -180 are the same meridian), so compare
      // via the signed angular difference normalized into (-180, 180].
      const rawDiff = back.lon - lon;
      const wrapped = ((rawDiff + 180) % 360 + 360) % 360 - 180;
      expect(wrapped).toBeCloseTo(0, 2);
    });
  }
});
