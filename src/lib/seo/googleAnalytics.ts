const MEASUREMENT_ID = /^G-[A-Z0-9]+$/;

/** Google Analytics 4 measurement ID, for example G-ABC123XYZ. Empty means analytics is off. */
export function readGoogleAnalyticsId(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  if (!MEASUREMENT_ID.test(trimmed)) {
    throw new Error(
      "PUBLIC_GA_MEASUREMENT_ID must be a Google Analytics 4 measurement ID such as G-ABC123XYZ.",
    );
  }
  return trimmed;
}
