/**
 * Approximate subsolar point (the point on Earth directly under the sun) for a given UTC
 * instant, using standard low-precision solar position formulas (solar declination and the
 * equation of time, truncated Fourier series — the same family of approximations used by
 * NOAA's solar calculator). Accurate to within roughly a fraction of a degree, which is
 * plenty for a day/night shading overlay but is NOT an ephemeris and should not be used to
 * claim precise sunrise/sunset times.
 */
export interface SubsolarPoint {
  lat: number;
  lon: number;
}

export function getSubsolarPoint(epochMs: number): SubsolarPoint {
  const date = new Date(epochMs);
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = (epochMs - start) / 86_400_000; // fractional, includes time of day
  const utcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  const gamma = (2 * Math.PI * (Math.floor(dayOfYear) - 1 + (utcHours - 12) / 24)) / 365;

  const eqTimeMinutes =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const declinationRad =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const lat = (declinationRad * 180) / Math.PI;

  let lon = -15 * (utcHours - 12 + eqTimeMinutes / 60);
  lon = ((lon + 180) % 360 + 360) % 360 - 180;

  return { lat, lon };
}
