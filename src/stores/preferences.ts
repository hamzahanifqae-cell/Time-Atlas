import { atom } from "nanostores";
import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  MAX_SAVED_CITIES,
  type Preferences,
} from "../lib/storage/preferences";

export { MAX_SAVED_CITIES };

export const $preferences = atom<Preferences>(DEFAULT_PREFERENCES);
/** Set to a user-facing message when the last storage write failed (quota/unavailable). */
export const $storageWarning = atom<string | null>(null);

let initialized = false;
export function initPreferences(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  $preferences.set(loadPreferences());
}

function persist(next: Preferences) {
  $preferences.set(next);
  const ok = savePreferences(next);
  $storageWarning.set(
    ok ? null : "Your preferences couldn't be saved on this device (storage is full or disabled), so they'll reset when you leave.",
  );
}

export function setHour12(hour12: boolean): void {
  persist({ ...$preferences.get(), hour12 });
}

export function setAutoRotate(autoRotate: boolean): void {
  persist({ ...$preferences.get(), autoRotate });
}

export function addSavedCity(id: number): "added" | "duplicate" | "full" {
  const current = $preferences.get();
  if (current.savedCityIds.includes(id)) return "duplicate";
  if (current.savedCityIds.length >= MAX_SAVED_CITIES) return "full";
  persist({ ...current, savedCityIds: [...current.savedCityIds, id] });
  return "added";
}

export function removeSavedCity(id: number): void {
  const current = $preferences.get();
  persist({ ...current, savedCityIds: current.savedCityIds.filter((c) => c !== id) });
}

export function clearSavedCities(): void {
  persist({ ...$preferences.get(), savedCityIds: [] });
}
