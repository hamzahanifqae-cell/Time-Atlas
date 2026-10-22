import { DateTime } from "luxon";

/** UTC offset in minutes for the given IANA zone at the given instant. */
export function getOffsetMinutes(tz: string, epochMs: number): number {
  return DateTime.fromMillis(epochMs, { zone: tz }).offset;
}

/** "UTC+05:30" / "UTC−08:00" / "UTC" style label. Uses the real minus sign for negatives. */
export function formatOffsetLabel(tz: string, epochMs: number): string {
  const minutes = getOffsetMinutes(tz, epochMs);
  if (minutes === 0) return "UTC";
  const sign = minutes > 0 ? "+" : "−";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

/** Difference (otherTz - baseTz) in minutes at the given shared instant. */
export function getOffsetDifferenceMinutes(baseTz: string, otherTz: string, epochMs: number): number {
  return getOffsetMinutes(otherTz, epochMs) - getOffsetMinutes(baseTz, epochMs);
}

/** Human label for a time difference, e.g. "5h30m ahead", "3h behind", "same time". */
export function formatDifferenceLabel(diffMinutes: number): string {
  if (diffMinutes === 0) return "Same time";
  const ahead = diffMinutes > 0;
  const abs = Math.abs(diffMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  return `${parts.join(" ")} ${ahead ? "ahead" : "behind"}`;
}
