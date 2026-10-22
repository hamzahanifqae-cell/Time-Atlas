import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { geoContains } from "d3-geo";
import { buildBoundarySegments } from "../src/lib/globe/buildBoundarySegments";
import { findBoundaryAtPoint } from "../src/lib/geo/pointInCountry";
import type { BoundaryCollection } from "../src/lib/geo/load";

let boundaries: BoundaryCollection;

beforeAll(() => {
  const file = path.join(process.cwd(), "public/data/boundaries.geojson");
  boundaries = JSON.parse(fs.readFileSync(file, "utf8"));
});

describe("buildBoundarySegments (synthetic)", () => {
  it("turns a simple square ring into 4 closed segments", () => {
    const synthetic: BoundaryCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { code: "ZZ", code3: "ZZZ", name: "Testland" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [0, 10],
                [10, 10],
                [10, 0],
              ],
            ],
          },
        },
      ],
    };
    const result = buildBoundarySegments(synthetic, 1);
    expect(result.totalSegments).toBe(4);
    expect(result.rangesByCode.get("ZZ")).toEqual({ start: 0, count: 4 });
    expect(result.positions.length).toBe(4 * 6);
  });

  it("skips features with no ISO code (disputed/uninhabited areas) in the code index but still emits their segments", () => {
    const synthetic: BoundaryCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { code: null, code3: null, name: "Disputed Area" },
          geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1]]] },
        },
      ],
    };
    const result = buildBoundarySegments(synthetic, 1);
    expect(result.totalSegments).toBe(3);
    expect(result.rangesByCode.size).toBe(0);
  });
});

describe("buildBoundarySegments (real boundaries.geojson)", () => {
  it("includes a plausible number of countries and segments", () => {
    const result = buildBoundarySegments(boundaries, 1);
    expect(result.rangesByCode.size).toBeGreaterThan(150);
    expect(result.totalSegments).toBeGreaterThan(1000);
  });

  it("gives every ring point in a MultiPolygon its own segment without cross-part jumps (Fiji, antimeridian)", () => {
    const fiji = boundaries.features.find((f) => f.properties.code === "FJ")!;
    expect(fiji).toBeTruthy();
    expect(fiji.geometry.type).toBe("MultiPolygon");

    const coords = fiji.geometry.type === "MultiPolygon" ? fiji.geometry.coordinates : [];
    const expectedSegments = coords.reduce(
      (sum, poly) => sum + poly.reduce((s, ring) => s + ring.length, 0),
      0,
    );

    const result = buildBoundarySegments(boundaries, 1);
    const range = result.rangesByCode.get("FJ")!;
    expect(range.count).toBe(expectedSegments);
  });

  it("confirms Fiji's own geometry straddles the antimeridian (parts on both sides of +/-180)", () => {
    const fiji = boundaries.features.find((f) => f.properties.code === "FJ")!;
    const coords = fiji.geometry.type === "MultiPolygon" ? fiji.geometry.coordinates : [];
    const lons = (coords.flat(2) as Array<[number, number]>).map(([lon]) => lon);
    expect(lons.some((lon) => lon > 170)).toBe(true);
    expect(lons.some((lon) => lon < -170)).toBe(true);
  });
});

describe("findBoundaryAtPoint", () => {
  it("resolves a point in Paris to France", () => {
    const result = findBoundaryAtPoint(boundaries, 2.35, 48.85);
    expect(result?.properties.code).toBe("FR");
  });

  it("resolves a point in open ocean to no country", () => {
    const result = findBoundaryAtPoint(boundaries, -140, 0);
    expect(result).toBeNull();
  });

  it("resolves a point just east of the antimeridian correctly for Fiji", () => {
    // d3-geo's geoContains is the authority here; we just confirm our wrapper agrees with it
    // directly for a known Fiji landmass point near the dateline.
    const fiji = boundaries.features.find((f) => f.properties.code === "FJ")!;
    const viti_levu = [178.05, -17.7] as [number, number];
    expect(geoContains(fiji, viti_levu)).toBe(true);
    expect(findBoundaryAtPoint(boundaries, viti_levu[0], viti_levu[1])?.properties.code).toBe("FJ");
  });
});
