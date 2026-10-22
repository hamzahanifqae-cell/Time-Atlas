import { latLonToVector3 } from "../geo/sphere";
import type { BoundaryCollection } from "../geo/load";

export interface SegmentRange {
  /** Index of the first segment (2 vertices each) belonging to this feature. */
  start: number;
  /** Number of segments. */
  count: number;
}

export interface BoundarySegments {
  /** Flat xyz triples, 2 vertices (6 floats) per line segment — feed straight into a
   *  THREE.BufferAttribute for a LineSegments geometry. */
  positions: Float32Array;
  /** Segment range (in `positions`, measured in segments) for each ISO-coded country. */
  rangesByCode: Map<string, SegmentRange>;
  totalSegments: number;
}

type Ring = Array<[number, number]>;

/**
 * Flattens every country boundary ring in `boundaries` into line segments positioned on a
 * sphere of the given radius, for rendering as a single THREE.LineSegments draw call. Also
 * records each country's vertex range so a renderer can recolor just the selected country's
 * segments (for highlighting) without rebuilding the geometry.
 */
export function buildBoundarySegments(boundaries: BoundaryCollection, radius: number): BoundarySegments {
  const flat: number[] = [];
  const rangesByCode = new Map<string, SegmentRange>();

  function pushRing(ring: Ring) {
    for (let i = 0; i < ring.length; i++) {
      const [lon1, lat1] = ring[i];
      const [lon2, lat2] = ring[(i + 1) % ring.length];
      const a = latLonToVector3(lat1, lon1, radius);
      const b = latLonToVector3(lat2, lon2, radius);
      flat.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }

  for (const feature of boundaries.features) {
    const startSegment = flat.length / 6;
    const geom = feature.geometry;
    if (geom.type === "Polygon") {
      for (const ring of geom.coordinates as Ring[]) pushRing(ring);
    } else if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates as Ring[][]) {
        for (const ring of poly) pushRing(ring);
      }
    }
    const count = flat.length / 6 - startSegment;
    const code = feature.properties?.code;
    if (code) {
      const existing = rangesByCode.get(code);
      if (existing) {
        // A country can appear as more than one feature in rare cases; merge is not
        // contiguous so we just keep the largest range (avoids wrongly highlighting
        // unrelated segments). This is a defensive fallback, not expected in practice.
        if (count > existing.count) rangesByCode.set(code, { start: startSegment, count });
      } else {
        rangesByCode.set(code, { start: startSegment, count });
      }
    }
  }

  return {
    positions: new Float32Array(flat),
    rangesByCode,
    totalSegments: flat.length / 6,
  };
}
