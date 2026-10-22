/**
 * Converts latitude/longitude (degrees) to a point on a sphere of the given radius, using
 * the same parameterization as three.js's SphereGeometry default UV layout (theta = azimuth
 * from +Z toward +X, phi = polar angle from +Y). This means a standard equirectangular
 * texture (row 0 = north pole, column 0 = -180° longitude) lines up on the sphere's default
 * UVs with no extra rotation or texture offset — see sphere.test.ts for the coordinates this
 * is checked against.
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function latLonToVector3(latDeg: number, lonDeg: number, radius = 1): Vec3 {
  const phi = ((90 - latDeg) * Math.PI) / 180; // polar angle from +Y (north pole)
  const theta = ((lonDeg + 180) * Math.PI) / 180; // azimuth

  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

/** Inverse of latLonToVector3, for turning a click/intersection point back into lat/lon. */
export function vector3ToLatLon(v: Vec3, radius = 1): { lat: number; lon: number } {
  const phi = Math.acos(Math.max(-1, Math.min(1, v.y / radius)));
  let theta = Math.atan2(v.z, -v.x);
  if (theta < 0) theta += 2 * Math.PI;
  const lat = 90 - (phi * 180) / Math.PI;
  let lon = (theta * 180) / Math.PI - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return { lat, lon };
}
