import { describe, it, expect } from "vitest";
import { geoArea } from "d3-geo";
import { simplifyRing } from "../scripts/data/lib/simplify.mjs";

function ringArea(ring: Array<[number, number]>): number {
  return geoArea({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } } as never);
}

describe("simplifyRing", () => {
  it("leaves small rings untouched", () => {
    const ring: Array<[number, number]> = [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ];
    expect(simplifyRing(ring, 0.1)).toEqual(ring);
  });

  it("never produces a ring whose spherical area reads as implausibly large relative to a regular shape of the same footprint", () => {
    // Regression case: this specific small, irregular quadrilateral is known to send
    // d3-geo's geoArea to ~4*PI (a full sphere) if reduced to very few points, in EITHER
    // winding direction — a floating-point cancellation issue in the spherical area
    // algorithm for small few-vertex polygons, discovered while building the boundary data
    // pipeline. simplifyRing's vertex floor exists specifically to avoid ever producing
    // something this small from a ring that didn't start out that way.
    const fragileRing: Array<[number, number]> = [
      [6.798106, 53.604438],
      [6.790331, 53.601122],
      [6.779552, 53.597884],
      [6.722423, 53.590766],
      [6.741883, 53.579212],
      [6.756521, 53.562893],
      [6.701247, 53.571334],
      [6.659516, 53.599107],
      [6.680194, 53.60881],
    ];
    const simplified = simplifyRing(fragileRing, 0.1);
    const area = ringArea(simplified);
    expect(area).toBeLessThan(0.01);
  });

  it("holds geoArea roughly stable (within an order of magnitude) for a realistic coastline-like ring", () => {
    // A jagged but simple (non-self-intersecting) 40-point "coastline" ring.
    const ring: Array<[number, number]> = Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 40) * 2 * Math.PI;
      const wobble = 1 + 0.15 * Math.sin(angle * 7);
      return [Math.cos(angle) * wobble, Math.sin(angle) * wobble] as [number, number];
    });
    const originalArea = ringArea(ring);
    const simplified = simplifyRing(ring, 0.3);
    const simplifiedArea = ringArea(simplified);
    expect(simplifiedArea).toBeGreaterThan(originalArea * 0.5);
    expect(simplifiedArea).toBeLessThan(originalArea * 1.5);
  });

  it("never returns a ring shorter than the minimum vertex floor (or the original, if shorter)", () => {
    const ring: Array<[number, number]> = Array.from({ length: 60 }, (_, i) => [
      Math.cos((i / 60) * 2 * Math.PI),
      Math.sin((i / 60) * 2 * Math.PI),
    ]);
    const simplified = simplifyRing(ring, 0.01);
    expect(simplified.length).toBeGreaterThanOrEqual(12);
  });
});
