import { describe, it, expect } from "vitest";
import { getDstStatus } from "../src/lib/time/dst";

describe("getDstStatus", () => {
  it("reports standard time in northern-hemisphere winter (New York, January)", () => {
    const ms = Date.UTC(2026, 0, 15, 12, 0, 0);
    const status = getDstStatus("America/New_York", ms);
    expect(status.supported).toBe(true);
    expect(status.isDst).toBe(false);
  });

  it("reports daylight time in northern-hemisphere summer (New York, July)", () => {
    const ms = Date.UTC(2026, 6, 15, 12, 0, 0);
    const status = getDstStatus("America/New_York", ms);
    expect(status.supported).toBe(true);
    expect(status.isDst).toBe(true);
  });

  it("correctly reports southern-hemisphere DST as inverted vs the north (Sydney, January = summer/DST)", () => {
    const ms = Date.UTC(2026, 0, 15, 12, 0, 0);
    const status = getDstStatus("Australia/Sydney", ms);
    expect(status.supported).toBe(true);
    expect(status.isDst).toBe(true);
  });

  it("reports southern-hemisphere standard time in July (Sydney, winter)", () => {
    const ms = Date.UTC(2026, 6, 15, 12, 0, 0);
    const status = getDstStatus("Australia/Sydney", ms);
    expect(status.supported).toBe(true);
    expect(status.isDst).toBe(false);
  });

  it("reports unsupported (no DST claim) for a zone with no DST at all", () => {
    const ms = Date.UTC(2026, 6, 15, 12, 0, 0);
    const status = getDstStatus("Asia/Tokyo", ms);
    expect(status.supported).toBe(false);
  });

  it("flips status across the spring-forward transition (America/New_York 2026)", () => {
    // US spring-forward in 2026 is Sunday, 8 March, 02:00 local -> 03:00 local (07:00 UTC).
    const before = Date.UTC(2026, 2, 8, 6, 59, 0);
    const after = Date.UTC(2026, 2, 8, 7, 1, 0);
    expect(getDstStatus("America/New_York", before).isDst).toBe(false);
    expect(getDstStatus("America/New_York", after).isDst).toBe(true);
  });

  it("flips status across the fall-back transition (America/New_York 2026)", () => {
    // US fall-back in 2026 is Sunday, 1 November, 02:00 local (06:00 UTC) EDT->EST.
    const before = Date.UTC(2026, 10, 1, 5, 59, 0);
    const after = Date.UTC(2026, 10, 1, 6, 1, 0);
    expect(getDstStatus("America/New_York", before).isDst).toBe(true);
    expect(getDstStatus("America/New_York", after).isDst).toBe(false);
  });
});
