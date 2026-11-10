import { useStore } from "@nanostores/react";
import { $referenceInstant, deviceTimeZone } from "../../stores/clock";
import { $preferences } from "../../stores/preferences";
import { useHydrated } from "../../lib/hooks/useHydrated";
import { getClockParts } from "../../lib/time/format";
import { formatOffsetLabel } from "../../lib/time/offset";

/** Always-available clock for the visitor's own browser time zone. Needs no network data,
 *  so it renders correctly before the city dataset or the globe have loaded.
 *  The first render is a stable placeholder: the built HTML and the browser must match
 *  before the live device time is filled in. */
export default function DeviceClock() {
  const hydrated = useHydrated();
  const instant = useStore($referenceInstant);
  const { hour12 } = useStore($preferences);
  const parts = hydrated ? getClockParts(deviceTimeZone, instant, hour12) : null;
  const offsetLabel = hydrated ? formatOffsetLabel(deviceTimeZone, instant) : null;

  return (
    <div className="inline-flex items-baseline gap-3 rounded-lg border border-navy-700 bg-navy-800/50 px-4 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-paper-600">Device time</span>
      <span className="tabular text-lg font-semibold text-paper-100">
        {parts ? parts.hm : "––:––"}
        {parts?.ampm && <span className="ml-1 text-xs font-medium text-paper-400">{parts.ampm}</span>}
      </span>
      <span className="tabular text-xs text-paper-600">
        {hydrated ? `${deviceTimeZone} · ${offsetLabel}` : "––"}
      </span>
    </div>
  );
}
