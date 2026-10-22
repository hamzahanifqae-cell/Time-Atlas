import { getOffsetMinutes } from "./offset";

export interface DstStatus {
  /**
   * False when we can't responsibly claim a DST status for this instant — e.g. the zone
   * has no clock-offset transition within a year in either direction (most of Asia/Africa,
   * or a zone that has simply abolished DST). Callers should show the UTC offset only.
   */
  supported: boolean;
  /** Only meaningful when `supported` is true. */
  isDst?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const COARSE_STEP_DAYS = 15;
const MAX_DAYS = 370;
const MINUTE_MS = 60_000;

/**
 * Finds the first instant at or after `fromMs` where the zone's UTC offset differs from
 * the offset at `fromMs` — i.e. the start of the "next" regime. Returns null if no such
 * transition occurs within a year.
 */
function findNextBoundary(tz: string, fromMs: number): number | null {
  const startOffset = getOffsetMinutes(tz, fromMs);

  let prev = fromMs;
  let prevOffset = startOffset;
  let lo: number | null = null;
  let hi: number | null = null;
  for (let day = COARSE_STEP_DAYS; day <= MAX_DAYS; day += COARSE_STEP_DAYS) {
    const t = fromMs + day * DAY_MS;
    const off = getOffsetMinutes(tz, t);
    if (off !== prevOffset) {
      lo = prev;
      hi = t;
      break;
    }
    prev = t;
    prevOffset = off;
  }
  if (lo === null || hi === null) return null;

  // Day-level narrowing: walk forward from lo toward hi.
  const loOffset = getOffsetMinutes(tz, lo);
  for (let t = lo + DAY_MS; t < hi; t += DAY_MS) {
    const off = getOffsetMinutes(tz, t);
    if (off !== loOffset) {
      hi = t;
      break;
    }
    lo = t;
  }

  // Binary search: lo always has the old offset, hi always has the new one, lo < hi.
  let left = lo;
  let right = hi;
  while (right - left > MINUTE_MS) {
    const mid = left + Math.floor((right - left) / 2);
    if (getOffsetMinutes(tz, mid) === loOffset) {
      left = mid;
    } else {
      right = mid;
    }
  }
  return right;
}

/**
 * Finds the instant the CURRENT regime (the one containing `fromMs`) began — i.e. the
 * nearest offset-transition boundary strictly before `fromMs`. Returns null if the offset
 * has been constant for at least a year before `fromMs`.
 */
function findPreviousBoundary(tz: string, fromMs: number): number | null {
  const currentOffset = getOffsetMinutes(tz, fromMs);

  let prev = fromMs;
  let prevOffset = currentOffset;
  let lo: number | null = null; // past regime sample (different offset)
  let hi: number | null = null; // current regime sample
  for (let day = COARSE_STEP_DAYS; day <= MAX_DAYS; day += COARSE_STEP_DAYS) {
    const t = fromMs - day * DAY_MS;
    const off = getOffsetMinutes(tz, t);
    if (off !== prevOffset) {
      lo = t;
      hi = prev;
      break;
    }
    prev = t;
    prevOffset = off;
  }
  if (lo === null || hi === null) return null;

  // Day-level narrowing: walk backward from hi toward lo.
  const hiOffset = getOffsetMinutes(tz, hi);
  for (let t = hi - DAY_MS; t > lo; t -= DAY_MS) {
    const off = getOffsetMinutes(tz, t);
    if (off !== hiOffset) {
      lo = t;
      break;
    }
    hi = t;
  }

  // Binary search: left always past-regime, right always current-regime, left < right.
  let left = lo;
  let right = hi;
  while (right - left > MINUTE_MS) {
    const mid = left + Math.floor((right - left) / 2);
    if (getOffsetMinutes(tz, mid) === hiOffset) {
      right = mid;
    } else {
      left = mid;
    }
  }
  return right;
}

const cache = new Map<string, DstStatus>();
const MAX_CACHE_ENTRIES = 500;

/**
 * Cache key is per (zone, minute). A day-level bucket would be cheaper but is wrong on the
 * day of a transition, since status can (and does) change mid-day exactly then — minute
 * resolution is still far cheaper than recomputing on every call and never crosses a real
 * transition within one bucket.
 */
function cacheKey(tz: string, epochMs: number): string {
  const minuteBucket = Math.floor(epochMs / MINUTE_MS);
  return `${tz}|${minuteBucket}`;
}

/**
 * Determines whether `epochMs` falls in daylight-saving (summer) time for `tz`, by locating
 * the nearest real transitions before and after and comparing offsets — the daylight-saving
 * offset is, by definition, always the larger (more positive) of the two. If no transition
 * is found within a year in either direction, or the surrounding transitions don't form a
 * clean two-state oscillation, we report `supported: false` rather than guess. This never
 * relies on fixed calendar-month sampling (e.g. "January vs July"), so it works the same way
 * for northern- and southern-hemisphere zones.
 */
export function getDstStatus(tz: string, epochMs: number): DstStatus {
  const key = cacheKey(tz, epochMs);
  const cached = cache.get(key);
  if (cached) return cached;

  const current = getOffsetMinutes(tz, epochMs);
  const previousBoundary = findPreviousBoundary(tz, epochMs);
  const nextBoundary = findNextBoundary(tz, epochMs);

  let result: DstStatus = { supported: false };
  if (previousBoundary !== null && nextBoundary !== null) {
    const otherOffsetBefore = getOffsetMinutes(tz, previousBoundary - MINUTE_MS);
    const otherOffsetAfter = getOffsetMinutes(tz, nextBoundary);
    if (otherOffsetBefore === otherOffsetAfter && otherOffsetBefore !== current) {
      result = { supported: true, isDst: current > otherOffsetBefore };
    }
  }

  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(key, result);
  return result;
}
