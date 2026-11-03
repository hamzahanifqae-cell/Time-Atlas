import { DateTime } from "luxon";
import { formatDifferenceLabel, formatOffsetLabel, getOffsetDifferenceMinutes } from "../time/offset";

/** Noon UTC on dates away from the transition hour itself. */
export const SAMPLE_DATES = [
  { id: "january", label: "15 January 2026", ms: Date.UTC(2026, 0, 15, 12, 0, 0) },
  { id: "march", label: "15 March 2026", ms: Date.UTC(2026, 2, 15, 12, 0, 0) },
  { id: "july", label: "15 July 2026", ms: Date.UTC(2026, 6, 15, 12, 0, 0) },
] as const;

export function offsetLabel(zone: string, epochMs: number): string {
  return formatOffsetLabel(zone, epochMs);
}

/** "Tokyo is 14h ahead of New York" at one shared instant. */
export function gapSentence(
  otherName: string,
  baseName: string,
  baseZone: string,
  otherZone: string,
  epochMs: number,
): string {
  const minutes = getOffsetDifferenceMinutes(baseZone, otherZone, epochMs);
  if (minutes === 0) return `${otherName} matches ${baseName}`;
  const label = formatDifferenceLabel(minutes);
  if (label.endsWith("ahead")) {
    return `${otherName} is ${label.slice(0, -"ahead".length).trim()} ahead of ${baseName}`;
  }
  if (label.endsWith("behind")) {
    return `${otherName} is ${label.slice(0, -"behind".length).trim()} behind ${baseName}`;
  }
  return `${otherName} is ${label} ${baseName}`;
}

/**
 * A fixed evening in New York, and the same instant in Tokyo.
 * Used to show a calendar-date change. This is not "the time right now".
 */
export function newYorkEveningInTokyo(): { newYork: string; tokyo: string; nextCalendarDate: boolean } {
  const newYork = DateTime.fromObject(
    { year: 2026, month: 1, day: 15, hour: 22, minute: 0 },
    { zone: "America/New_York" },
  );
  const tokyo = newYork.setZone("Asia/Tokyo");
  return {
    newYork: newYork.toFormat("HH:mm 'on' d MMMM yyyy"),
    tokyo: tokyo.toFormat("HH:mm 'on' d MMMM yyyy"),
    nextCalendarDate: newYork.toFormat("yyyy-MM-dd") !== tokyo.toFormat("yyyy-MM-dd"),
  };
}
