import { DateTime } from "luxon";

/** UTC offset in minutes for the given IANA zone at the given instant. */
export function getOffsetMinutes(tz: string, epochMs: number): number {
  return DateTime.fromMillis(epochMs, { zone: tz }).offset;
}

/** "UTC+05:30" / "UTC−08:00" / "UTC" style label. Uses the real minus sign for negatives. */
export function formatOffsetLabel(tz: string, epochMs: number): string {
  const minutes = getOffsetMinutes(tz, epochMs);
  if (!Number.isFinite(minutes)) return "Unavailable";
  if (minutes === 0) return "UTC";
  const sign = minutes > 0 ? "+" : "−";
  const seconds = Math.round(Math.abs(minutes) * 60);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  const sec = seconds % 60;
  return `UTC${sign}${h}${m || sec ? `:${String(m).padStart(2, "0")}` : ""}${sec ? `:${String(sec).padStart(2, "0")}` : ""}`;
}

/** Difference (otherTz - baseTz) in minutes at the given shared instant. */
export function getOffsetDifferenceMinutes(baseTz: string, otherTz: string, epochMs: number): number {
  return getOffsetMinutes(otherTz, epochMs) - getOffsetMinutes(baseTz, epochMs);
}

/** Human label for a time difference, e.g. "5h30m ahead", "3h behind", "same time". */
export function formatDifferenceLabel(diffMinutes: number): string {
  if (!Number.isFinite(diffMinutes)) return "Unavailable";
  // Offsets before standard time can contain seconds. Keep those accurate while avoiding
  // floating-point artefacts such as 28.200000000045m (28m 12s).
  const seconds = Math.round(Math.abs(diffMinutes) * 60);
  if (seconds === 0) return "Same time";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  const sec = seconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (sec) parts.push(`${sec}s`);
  return `${parts.join(" ")} ${diffMinutes > 0 ? "ahead" : "behind"}`;
}
