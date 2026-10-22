import { describe, it, expect } from "vitest";
import { latLonToVector3 } from "../src/lib/geo/sphere";
import { getSubsolarPoint } from "../src/lib/time/solar";

/**
 * The globe's day/night shader (src/lib/globe/shaders.ts) colors a point by
 * dot(surfaceNormal, sunDirection): positive => day, negative => night, ~0 => terminator.
 * Both the sphere mesh's per-vertex normal and the sun-direction uniform are built from the
 * same latLonToVector3 convention (see GlobeCanvas.tsx and sphere.ts's own doc comment), so
 * that dot product is reproducible here in plain TS without a WebGL context — this is the
 * actual math the shader runs, not just an analogous check.
 */
function dot(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

describe("day/night shader alignment", () => {
  it("places the subsolar point itself at maximum daylight (dot ~= 1)", () => {
    const instant = Date.UTC(2026, 5, 21, 12, 0, 0);
    const sun = getSubsolarPoint(instant);
    const sunDir = latLonToVector3(sun.lat, sun.lon, 1);
    const samePoint = latLonToVector3(sun.lat, sun.lon, 1);
    expect(dot(sunDir, samePoint)).toBeCloseTo(1, 5);
  });

  it("places the antisolar point at maximum night (dot ~= -1)", () => {
    const instant = Date.UTC(2026, 5, 21, 12, 0, 0);
    const sun = getSubsolarPoint(instant);
    const sunDir = latLonToVector3(sun.lat, sun.lon, 1);
    const antipode = latLonToVector3(-sun.lat, sun.lon > 0 ? sun.lon - 180 : sun.lon + 180, 1);
    expect(dot(sunDir, antipode)).toBeCloseTo(-1, 5);
  });

  it("places a point 90 degrees from the subsolar point on the terminator (dot ~= 0)", () => {
    const instant = Date.UTC(2026, 2, 20, 12, 0, 0); // near equinox, subsolar lat ~0
    const sun = getSubsolarPoint(instant);
    const sunDir = latLonToVector3(sun.lat, sun.lon, 1);
    // A point 90 degrees east of the subsolar longitude, on the equator.
    const terminatorPoint = latLonToVector3(0, sun.lon + 90, 1);
    expect(Math.abs(dot(sunDir, terminatorPoint))).toBeLessThan(0.15);
  });

  it("agrees with real-world intuition: at 12:00 UTC, a city near the Greenwich meridian is in daylight and its antipode (near the date line) is in night", () => {
    const instant = Date.UTC(2026, 5, 21, 12, 0, 0); // local noon-ish at 0 degrees longitude
    const sun = getSubsolarPoint(instant);
    const sunDir = latLonToVector3(sun.lat, sun.lon, 1);

    const londonish = latLonToVector3(51.5, -0.1, 1);
    const aucklandish = latLonToVector3(-36.8, 174.8, 1);

    expect(dot(sunDir, londonish)).toBeGreaterThan(0);
    expect(dot(sunDir, aucklandish)).toBeLessThan(0);
  });
});
