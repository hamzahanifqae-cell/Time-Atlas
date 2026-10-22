#!/usr/bin/env node
/**
 * Builds public/data/boundaries.geojson: simplified country polygons used by both the 3D
 * globe and the 2D WebGL-fallback map.
 *
 * Source: Natural Earth 10m Admin-0 Countries, via the datasets/geo-countries MIT-licensed
 * GeoJSON packaging (see /DATA_SOURCES.md). Properties are remapped to {code, code3, name};
 * `code` is null for the ~20 disputed/uninhabited areas Natural Earth has no ISO 3166-1 code
 * for (Kosovo, Somaliland, Antarctic claims, etc.) — those are still drawn so the globe's
 * landmass looks complete, but the UI treats them as non-selectable (no timezone data).
 *
 * Geometry is simplified per-ring with a small local Douglas-Peucker implementation (see
 * ./lib/simplify.mjs for why — mapshaper's shared-topology simplifier corrupted Indonesia's
 * ~100-part archipelago into a self-intersecting shape that d3-geo's spherical geoContains/
 * geoArea read as covering most of the globe). Every output feature's geoArea is sanity-
 * checked against its original area before writing, so that class of corruption can't ship
 * silently again.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { geoArea } from "d3-geo";
import { RAW_DIR, GENERATED_DIR } from "./lib/paths.mjs";
import { simplifyRing } from "./lib/simplify.mjs";

const TARGET_FRACTION = Number(process.env.SIMPLIFY_TARGET_FRACTION ?? "0.08");

function simplifyGeometry(geometry) {
  if (geometry.type === "Polygon") {
    return { type: "Polygon", coordinates: geometry.coordinates.map((ring) => simplifyRing(ring, TARGET_FRACTION)) };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geometry.coordinates.map((poly) => poly.map((ring) => simplifyRing(ring, TARGET_FRACTION))),
    };
  }
  return geometry;
}

async function main() {
  await mkdir(GENERATED_DIR, { recursive: true });

  const raw = JSON.parse(await readFile(path.join(RAW_DIR, "countries.geojson"), "utf8"));

  const features = raw.features.map((f) => {
    const iso2 = f.properties["ISO3166-1-Alpha-2"];
    const iso3 = f.properties["ISO3166-1-Alpha-3"];
    return {
      type: "Feature",
      properties: {
        code: iso2 === "-99" ? null : iso2,
        code3: iso3 === "-99" ? null : iso3,
        name: f.properties.name,
      },
      geometry: simplifyGeometry(f.geometry),
    };
  });

  // Sanity guard: a single country's solid angle can never approach a full sphere (4π sr).
  // If simplification ever breaks winding/topology again (as mapshaper's did for Indonesia),
  // geoArea on the broken feature will blow up to some large multiple of 4π — catch that here
  // instead of silently shipping geometry that makes geoContains nonsensical.
  const MAX_PLAUSIBLE_STERADIANS = 2 * Math.PI; // a hemisphere; real countries are far smaller
  const broken = [];
  for (let i = 0; i < features.length; i++) {
    const before = geoArea(raw.features[i]);
    const after = geoArea(features[i]);
    if (after > MAX_PLAUSIBLE_STERADIANS || after > before * 3 + 0.01) {
      broken.push({ name: features[i].properties.name, before, after });
    }
  }
  if (broken.length > 0) {
    console.error("Simplification produced implausible geometry for:");
    for (const b of broken) {
      console.error(`  ${b.name}: area ${b.before.toFixed(5)} -> ${b.after.toFixed(5)} sr`);
    }
    throw new Error("Aborting: simplified boundaries failed the geoArea sanity check.");
  }

  const output = { type: "FeatureCollection", features };
  const outFile = path.join(GENERATED_DIR, "boundaries.geojson");
  await writeFile(outFile, JSON.stringify(output));

  const stat = await import("node:fs/promises").then((m) => m.stat(outFile));
  const totalPoints = features.reduce((sum, f) => {
    const rings =
      f.geometry.type === "Polygon"
        ? f.geometry.coordinates
        : f.geometry.type === "MultiPolygon"
          ? f.geometry.coordinates.flat()
          : [];
    return sum + rings.reduce((s, r) => s + r.length, 0);
  }, 0);

  console.log(`boundaries.geojson: ${(stat.size / 1024).toFixed(0)} KB, ${features.length} features, ${totalPoints} points (target fraction=${TARGET_FRACTION})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
