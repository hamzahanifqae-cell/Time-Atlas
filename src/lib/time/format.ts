import { DateTime } from "luxon";

export interface ClockParts {
  /** "09:41" or "9:41" (12h) — hours and minutes, no seconds, for compact display. */
  hm: string;
  /** Zero-padded seconds, "07". Kept separate so callers can style/update it distinctly. */
  ss: string;
  /** "AM" | "PM" in 12h mode, otherwise null. */
  ampm: "AM" | "PM" | null;
  /** "Tuesday" */
  weekday: string;
  /** "14 March 2026" */
  dateLabel: string;
  /** ISO date (local to the zone), "2026-03-14" — stable key for comparisons. */
  isoDate: string;
  hour24: number;
  minute: number;
  second: number;
}

export function getClockParts(tz: string, epochMs: number, hour12: boolean): ClockParts {
  const dt = DateTime.fromMillis(epochMs, { zone: tz });
  const hour24 = dt.hour;
  let hourDisplay = hour24;
  let ampm: "AM" | "PM" | null = null;
  if (hour12) {
    ampm = hour24 >= 12 ? "PM" : "AM";
    hourDisplay = hour24 % 12;
    if (hourDisplay === 0) hourDisplay = 12;
  }
  const hm = `${hour12 ? hourDisplay : String(hourDisplay).padStart(2, "0")}:${String(dt.minute).padStart(2, "0")}`;
  return {
    hm,
    ss: String(dt.second).padStart(2, "0"),
    ampm,
    weekday: dt.toFormat("cccc"),
    dateLabel: dt.toFormat("d MMMM yyyy"),
    isoDate: dt.toFormat("yyyy-MM-dd"),
    hour24,
    minute: dt.minute,
    second: dt.second,
  };
}

/** Short, locale-stable label for a timezone's current standing, e.g. for lists. */
export function formatShortDate(tz: string, epochMs: number): string {
  return DateTime.fromMillis(epochMs, { zone: tz }).toFormat("ccc d MMM");
}
