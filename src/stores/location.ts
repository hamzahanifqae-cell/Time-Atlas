import { atom } from "nanostores";

export type Selection =
  | { type: "city"; id: number }
  | { type: "country"; code: string }
  | null;

export const $selection = atom<Selection>(null);

export function selectCity(id: number): void {
  $selection.set({ type: "city", id });
}

export function selectCountry(code: string): void {
  $selection.set({ type: "country", code });
}

export function clearSelection(): void {
  $selection.set(null);
}
