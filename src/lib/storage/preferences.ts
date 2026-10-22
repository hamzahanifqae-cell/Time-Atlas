import { z } from "zod";
import { safeGet, safeSet, safeRemove } from "./safeStorage";

const STORAGE_KEY = "timeatlas.preferences.v1";
const MAX_SAVED_CITIES = 6;

const PreferencesSchema = z.object({
  hour12: z.boolean(),
  savedCityIds: z
    .array(z.number().int().positive())
    .max(MAX_SAVED_CITIES)
    .transform((ids) => [...new Set(ids)]),
  autoRotate: z.boolean(),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  hour12: true,
  savedCityIds: [],
  autoRotate: true,
};

/** Reads and validates stored preferences. Corrupt or invalid data is discarded silently
 *  (never trusted into the app) and defaults are returned instead. */
export function loadPreferences(): Preferences {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(raw);
    const result = PreferencesSchema.safeParse(parsed);
    if (!result.success) {
      safeRemove(STORAGE_KEY);
      return DEFAULT_PREFERENCES;
    }
    return result.data;
  } catch {
    safeRemove(STORAGE_KEY);
    return DEFAULT_PREFERENCES;
  }
}

/** Returns whether the save actually succeeded (storage may be unavailable or full). */
export function savePreferences(prefs: Preferences): boolean {
  return safeSet(STORAGE_KEY, JSON.stringify(prefs));
}

export { MAX_SAVED_CITIES };
