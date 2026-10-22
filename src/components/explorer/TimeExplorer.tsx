import { useMemo } from "react";
import { useStore } from "@nanostores/react";
import { $referenceInstant, $mode, enterExplorer, returnToNow } from "../../stores/clock";

const MINUTES_PER_DAY = 24 * 60;

function isoDateUTC(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function minutesOfDayUTC(epochMs: number): number {
  const d = new Date(epochMs);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function formatUtcClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} UTC`;
}

export default function TimeExplorer() {
  const instant = useStore($referenceInstant);
  const mode = useStore($mode);

  const dateValue = useMemo(() => isoDateUTC(instant), [instant]);
  const minutesValue = useMemo(() => minutesOfDayUTC(instant), [instant]);

  function setFromParts(nextDate: string, nextMinutes: number) {
    const [y, m, d] = nextDate.split("-").map(Number);
    if (!y || !m || !d) return;
    const dayStart = Date.UTC(y, m - 1, d);
    enterExplorer(dayStart + nextMinutes * 60_000);
  }

  return (
    <section aria-labelledby="explorer-heading" className="rounded-2xl border border-navy-700 bg-navy-800/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="explorer-heading" className="text-lg font-semibold text-paper-100">
          Time explorer
        </h2>
        {mode === "explorer" && (
          <button
            type="button"
            onClick={returnToNow}
            className="rounded-md border border-cyan-600/50 bg-cyan-600/10 px-3 py-1.5 text-sm font-medium text-cyan-400 hover:bg-cyan-600/20"
          >
            Return to now
          </button>
        )}
      </div>

      <p className="mt-1 text-sm text-paper-600">
        Pick a date and time to see every clock as it will be then. All controls here are set
        in <span className="font-medium text-paper-400">UTC</span> to avoid ambiguity around
        daylight-saving changes in any one time zone.
      </p>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div>
          <label htmlFor="explorer-date" className="block text-xs font-medium text-paper-600">
            Date (UTC)
          </label>
          <input
            id="explorer-date"
            type="date"
            value={dateValue}
            onChange={(e) => setFromParts(e.target.value, minutesValue)}
            className="mt-1 rounded-md border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-paper-100"
          />
        </div>

        <div className="flex-1">
          <label htmlFor="explorer-time" className="flex items-baseline justify-between text-xs font-medium text-paper-600">
            <span>Time of day (UTC)</span>
            <span className="tabular text-sm text-paper-200">{formatUtcClock(minutesValue)}</span>
          </label>
          <input
            id="explorer-time"
            type="range"
            min={0}
            max={MINUTES_PER_DAY - 1}
            step={15}
            value={minutesValue}
            onChange={(e) => setFromParts(dateValue, Number(e.target.value))}
            className="mt-2 w-full accent-cyan-500"
            aria-valuetext={formatUtcClock(minutesValue)}
          />
        </div>
      </div>
    </section>
  );
}
