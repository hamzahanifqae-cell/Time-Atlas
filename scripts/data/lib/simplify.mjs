/**
 * A small, dependency-free Visvalingam-Whyatt polyline simplifier, applied per-ring
 * independently (lon/lat treated as flat 2D for tolerance purposes — fine at the degree
 * scale used here).
 *
 * We use this instead of mapshaper's simplifier: on this dataset, mapshaper's simplify (even
 * run on a single isolated feature, so not a cross-feature topology issue) restructures
 * complex multi-part countries in ways — e.g. consolidating Indonesia from 264 to 103
 * polygon parts — that produced polygons whose area/containment under d3-geo's spherical
 * geoArea/geoContains was nonsensical (readings of 100x+ a full sphere's solid angle).
 *
 * A from-scratch Douglas-Peucker (tried first) has its own closed-ring failure mode: picking
 * an arbitrary ring point as the "start/end" anchor and recursively splitting from there can
 * produce a self-intersecting ("bowtie") result for concave real coastlines far more often
 * than expected. Visvalingam-Whyatt — repeatedly dropping whichever point contributes the
 * smallest triangular area with its two current neighbors — only ever looks at local
 * neighborhoods, which avoids that failure mode in practice for this data.
 *
 * Belt-and-suspenders: we still (a) never reduce any ring below a vertex floor — empirically,
 * d3-geo's spherical area algorithm can lose essentially all precision to floating-point
 * cancellation on a very small, FEW-VERTEX irregular polygon regardless of winding, so
 * leaving more points in place keeps per-edge contributions small enough to stay numerically
 * sane — and (b) fall back to the original ring if a simplified result is self-intersecting.
 * build-boundaries.mjs additionally sanity-checks every output feature's geoArea before
 * writing, so a regression here can't ship silently again.
 */

function triangleArea(a, b, c) {
  return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
}

/** Visvalingam-Whyatt on an open polyline (first/last points are always kept). */
function visvalingamWhyatt(points, minPoints) {
  if (points.length <= minPoints) return points.slice();

  const n = points.length;
  const alive = new Array(n).fill(true);
  const prev = points.map((_, i) => i - 1);
  const next = points.map((_, i) => (i + 1 < n ? i + 1 : -1));
  prev[0] = -1;
  next[n - 1] = -1;

  const areas = new Array(n).fill(Infinity);
  function recomputeArea(i) {
    if (!alive[i] || prev[i] === -1 || next[i] === -1) {
      areas[i] = Infinity;
      return;
    }
    areas[i] = triangleArea(points[prev[i]], points[i], points[next[i]]);
  }
  for (let i = 1; i < n - 1; i++) recomputeArea(i);

  let aliveCount = n;
  while (aliveCount > minPoints) {
    let minIdx = -1;
    let minArea = Infinity;
    for (let i = 1; i < n - 1; i++) {
      if (alive[i] && areas[i] < minArea) {
        minArea = areas[i];
        minIdx = i;
      }
    }
    if (minIdx === -1) break;

    alive[minIdx] = false;
    aliveCount--;
    const p = prev[minIdx];
    const nx = next[minIdx];
    if (p !== -1) next[p] = nx;
    if (nx !== -1) prev[nx] = p;
    if (p > 0) recomputeArea(p);
    if (nx !== -1 && nx < n - 1) recomputeArea(nx);
  }

  const result = [];
  for (let i = 0; i < n; i++) if (alive[i]) result.push(points[i]);
  return result;
}

function segmentsIntersect(p1, p2, p3, p4) {
  function cross(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** O(n^2) simple-polygon check (fine here: only run on already-small simplified rings).
 *  Only checks for crossing *edges* — not a full topological validity check. */
function ringSelfIntersects(ring) {
  const n = ring.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i++) {
    const a1 = ring[i];
    const a2 = ring[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      if (j === i || j === i + 1 || (j + 1) % n === i) continue;
      const b1 = ring[j];
      const b2 = ring[(j + 1) % n];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

const SKIP_SIMPLIFY_BELOW_POINTS = 20;
const MIN_OUTPUT_POINTS = 12;

/** Simplifies a closed ring (first point not repeated at the end — GeoJSON rings here come
 *  from geo-countries without a repeated closing point) toward roughly `targetFraction` of
 *  its original point count, bounded below by MIN_OUTPUT_POINTS, falling back to the
 *  original ring if the result is implausibly small or self-intersecting. */
export function simplifyRing(ring, targetFraction) {
  if (ring.length <= SKIP_SIMPLIFY_BELOW_POINTS) return ring;
  const targetPoints = Math.max(MIN_OUTPUT_POINTS, Math.round(ring.length * targetFraction));
  if (targetPoints >= ring.length) return ring;

  // Treat the ring as an open loop by duplicating the first point at the end, so the
  // algorithm's "always keep first/last" rule keeps the ring closed.
  const asOpen = [...ring, ring[0]];
  const simplified = visvalingamWhyatt(asOpen, targetPoints + 1);
  const result = simplified.slice(0, -1);

  if (result.length < MIN_OUTPUT_POINTS) return ring;
  if (ringSelfIntersects(result)) return ring;
  return result;
}
