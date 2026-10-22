import { useStore } from "@nanostores/react";
import { $referenceInstant, $mode, deviceTimeZone, returnToNow } from "../../stores/clock";
import { $preferences } from "../../stores/preferences";
import { getClockParts } from "../../lib/time/format";
import { formatOffsetLabel, getOffsetDifferenceMinutes, formatDifferenceLabel } from "../../lib/time/offset";
import { getDstStatus } from "../../lib/time/dst";
import type { City } from "../../lib/geo/types";

interface ClockCardProps {
  city: City;
  /** Compact mode for comparison-tray use; full mode for the main hero clock. */
  variant?: "full" | "compact";
  onRemove?: () => void;
}

export default function ClockCard({ city, variant = "full", onRemove }: ClockCardProps) {
  const instant = useStore($referenceInstant);
  const mode = useStore($mode);
  const { hour12 } = useStore($preferences);

  const parts = getClockParts(city.tz, instant, hour12);
  const offsetLabel = formatOffsetLabel(city.tz, instant);
  const diffMinutes = getOffsetDifferenceMinutes(deviceTimeZone, city.tz, instant);
  const diffLabel = formatDifferenceLabel(diffMinutes);
  const dst = getDstStatus(city.tz, instant);
  const isDeviceZone = city.tz === deviceTimeZone;

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-navy-700 bg-navy-800/60 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-paper-100">
            {city.name}
            <span className="ml-1.5 text-xs font-normal text-paper-600">{city.country}</span>
          </p>
          <p className="text-xs text-paper-400">
            {parts.weekday} · {offsetLabel}
            {!isDeviceZone && <span className="ml-1.5">· {diffLabel}</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="tabular text-xl font-semibold text-paper-100">
            {parts.hm}
            {parts.ampm && <span className="ml-1 text-xs font-medium text-paper-400">{parts.ampm}</span>}
          </p>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${city.name} from comparison`}
              className="flex h-9 w-9 items-center justify-center rounded text-paper-600 hover:bg-navy-700 hover:text-danger-400"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-800/60 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-paper-100">
            {city.name}
            {city.admin1 && <span className="font-normal text-paper-400">, {city.admin1}</span>}
          </h2>
          <p className="text-sm text-paper-400">{city.country}</p>
        </div>
        <div className="flex items-center gap-2">
          {mode === "live" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-600/50 bg-cyan-600/10 px-2.5 py-1 text-xs font-medium text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden="true" />
              Live
            </span>
          ) : (
            <button
              type="button"
              onClick={returnToNow}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/20"
            >
              Exploring another time — return to now
            </button>
          )}
        </div>
      </div>

      <p className="clock-digits tabular mt-6 text-paper-100">
        <span className="clock-main">{parts.hm}</span>
        <span className="clock-seconds text-paper-400"><span>:</span><span>{parts.ss}</span></span>
        {parts.ampm && <span className="clock-period text-paper-400">{parts.ampm}</span>}
      </p>

      <p className="mt-2 text-paper-200">
        {parts.weekday}, {parts.dateLabel}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-paper-600">Time zone</dt>
          <dd className="tabular text-paper-100">{city.tz}</dd>
        </div>
        <div>
          <dt className="text-paper-600">UTC offset</dt>
          <dd className="tabular text-paper-100">{offsetLabel}</dd>
        </div>
        <div>
          <dt className="text-paper-600">Vs. device time</dt>
          <dd className="tabular text-paper-100">{isDeviceZone ? "Same time" : diffLabel}</dd>
        </div>
        <div>
          <dt className="text-paper-600">Daylight saving</dt>
          <dd className="text-paper-100">
            {dst.supported ? (
              <span className="inline-flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${dst.isDst ? "bg-amber-400" : "bg-cyan-500"}`}
                />
                {dst.isDst ? "In effect" : "Not in effect"}
              </span>
            ) : (
              "Not applicable here"
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
