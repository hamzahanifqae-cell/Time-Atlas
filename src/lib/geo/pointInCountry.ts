import { geoContains } from "d3-geo";
import type { BoundaryCollection } from "./load";
import type { CountryBoundaryProperties } from "./types";

/**
 * Finds which boundary feature (if any) contains the given [lon, lat] point, using d3-geo's
 * spherical point-in-polygon test (geoContains) — correct for multipart countries and
 * antimeridian-crossing polygons, since it operates in true spherical coordinates rather than
 * a flat projection.
 */
export function findBoundaryAtPoint(
  boundaries: BoundaryCollection,
  lon: number,
  lat: number,
): GeoJSON.Feature<GeoJSON.Geometry, CountryBoundaryProperties> | null {
  for (const feature of boundaries.features) {
    if (geoContains(feature, [lon, lat])) {
      return feature;
    }
  }
  return null;
}
