import { useStore } from "@nanostores/react";
import { $referenceInstant, deviceTimeZone } from "../../stores/clock";
import { $preferences } from "../../stores/preferences";
import { getClockParts } from "../../lib/time/format";
import { formatOffsetLabel } from "../../lib/time/offset";

/** Always-available clock for the visitor's own browser time zone. Needs no network data,
 *  so it renders correctly before the city dataset or the globe have loaded. */
export default function DeviceClock() {
  const instant = useStore($referenceInstant);
  const { hour12 } = useStore($preferences);
  const parts = getClockParts(deviceTimeZone, instant, hour12);
  const offsetLabel = formatOffsetLabel(deviceTimeZone, instant);

  return (
    <div className="inline-flex items-baseline gap-3 rounded-lg border border-navy-700 bg-navy-800/50 px-4 py-2.5">
      <span className="text-xs font-medium uppercase tracking-wide text-paper-600">Device time</span>
      <span className="tabular text-lg font-semibold text-paper-100">
        {parts.hm}
        {parts.ampm && <span className="ml-1 text-xs font-medium text-paper-400">{parts.ampm}</span>}
      </span>
      <span className="tabular text-xs text-paper-600">
        {deviceTimeZone} · {offsetLabel}
      </span>
    </div>
  );
}
