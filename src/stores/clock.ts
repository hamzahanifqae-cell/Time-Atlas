import { atom, computed } from "nanostores";

/** The device's detected IANA zone, labelled in the UI as "device time". */
export const deviceTimeZone: string =
  typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

export type ClockMode = "live" | "explorer";

export const $mode = atom<ClockMode>("live");
export const $liveNow = atom<number>(Date.now());
/** The UTC instant chosen in the Time Explorer, only used while mode === "explorer". */
export const $explorerInstant = atom<number>(Date.now());

/** The single shared instant every clock on the page reads from. */
export const $referenceInstant = computed(
  [$mode, $liveNow, $explorerInstant],
  (mode, live, explorer) => (mode === "live" ? live : explorer),
);

export function enterExplorer(instantMs: number): void {
  $explorerInstant.set(instantMs);
  $mode.set("explorer");
}

export function setExplorerInstant(instantMs: number): void {
  $explorerInstant.set(instantMs);
}

export function returnToNow(): void {
  $liveNow.set(Date.now());
  $mode.set("live");
}

let tickHandle: ReturnType<typeof setInterval> | null = null;
let started = false;

function tick() {
  $liveNow.set(Date.now());
}

function startTicking() {
  if (tickHandle !== null) return;
  tick();
  tickHandle = setInterval(tick, 1000);
}

function stopTicking() {
  if (tickHandle !== null) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

/** Starts the live-clock loop: ticks every second, pauses while the tab is hidden, and
 *  resynchronizes immediately (reading the real system clock, never an incremented counter)
 *  on visibility changes, focus, and wake from sleep. Call once, client-side only. */
export function startClock(): void {
  if (started || typeof document === "undefined") return;
  started = true;

  const handleVisibility = () => {
    if (document.hidden) {
      stopTicking();
    } else {
      tick();
      startTicking();
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("focus", tick);
  window.addEventListener("pageshow", tick);

  if (!document.hidden) startTicking();
}
