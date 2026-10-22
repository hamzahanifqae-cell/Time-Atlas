import { useStore } from "@nanostores/react";
import { $preferences, setHour12 } from "../../stores/preferences";

export default function HourFormatToggle() {
  const { hour12 } = useStore($preferences);

  return (
    <div
      role="group"
      aria-label="Clock format"
      className="inline-flex rounded-lg border border-navy-600 bg-navy-800 p-0.5 text-sm"
    >
      <button
        type="button"
        aria-pressed={hour12}
        onClick={() => setHour12(true)}
        className={`rounded-md px-3 py-1.5 ${hour12 ? "bg-navy-600 text-paper-100" : "text-paper-400 hover:text-paper-100"}`}
      >
        12h
      </button>
      <button
        type="button"
        aria-pressed={!hour12}
        onClick={() => setHour12(false)}
        className={`rounded-md px-3 py-1.5 ${!hour12 ? "bg-navy-600 text-paper-100" : "text-paper-400 hover:text-paper-100"}`}
      >
        24h
      </button>
    </div>
  );
}
