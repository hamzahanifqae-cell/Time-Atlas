import { describe, it, expect } from "vitest";
import {
  getOffsetMinutes,
  formatOffsetLabel,
  getOffsetDifferenceMinutes,
  formatDifferenceLabel,
} from "../src/lib/time/offset";

describe("getOffsetMinutes / formatOffsetLabel", () => {
  it("formats a whole-hour offset", () => {
    // Europe/Paris is UTC+1 in January (standard time).
    const ms = Date.UTC(2026, 0, 15, 12, 0, 0);
    expect(getOffsetMinutes("Europe/Paris", ms)).toBe(60);
    expect(formatOffsetLabel("Europe/Paris", ms)).toBe("UTC+1");
  });

  it("formats a half-hour offset (India)", () => {
    const ms = Date.UTC(2026, 5, 1, 0, 0, 0);
    expect(getOffsetMinutes("Asia/Kolkata", ms)).toBe(330);
    expect(formatOffsetLabel("Asia/Kolkata", ms)).toBe("UTC+5:30");
  });

  it("formats a quarter-hour offset (Nepal)", () => {
    const ms = Date.UTC(2026, 5, 1, 0, 0, 0);
    expect(getOffsetMinutes("Asia/Kathmandu", ms)).toBe(345);
    expect(formatOffsetLabel("Asia/Kathmandu", ms)).toBe("UTC+5:45");
  });

  it("formats negative offsets with a minus sign", () => {
    const ms = Date.UTC(2026, 5, 1, 0, 0, 0);
    expect(getOffsetMinutes("America/New_York", ms)).toBe(-240); // EDT in June
    expect(formatOffsetLabel("America/New_York", ms)).toBe("UTC−4");
  });

  it("formats UTC itself with no sign", () => {
    const ms = Date.UTC(2026, 5, 1, 0, 0, 0);
    expect(formatOffsetLabel("UTC", ms)).toBe("UTC");
  });
});

describe("getOffsetDifferenceMinutes / formatDifferenceLabel", () => {
  it("computes zero difference as 'Same time'", () => {
    const ms = Date.UTC(2026, 5, 1, 12, 0, 0);
    const diff = getOffsetDifferenceMinutes("Europe/London", "Europe/London", ms);
    expect(diff).toBe(0);
    expect(formatDifferenceLabel(diff)).toBe("Same time");
  });

  it("computes a positive (ahead) difference with hours and minutes", () => {
    // Asia/Kolkata (+5:30) vs UTC at the same instant => 330 minutes ahead.
    const ms = Date.UTC(2026, 5, 1, 12, 0, 0);
    const diff = getOffsetDifferenceMinutes("UTC", "Asia/Kolkata", ms);
    expect(diff).toBe(330);
    expect(formatDifferenceLabel(diff)).toBe("5h 30m ahead");
  });

  it("computes a negative (behind) difference", () => {
    const ms = Date.UTC(2026, 5, 1, 12, 0, 0);
    const diff = getOffsetDifferenceMinutes("UTC", "America/New_York", ms);
    expect(diff).toBe(-240);
    expect(formatDifferenceLabel(diff)).toBe("4h behind");
  });
});
