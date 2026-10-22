import { geoCentroid } from "d3-geo";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useStore } from "@nanostores/react";
import { getBoundaries, type BoundaryCollection } from "../../lib/geo/load";
import { isWebGLAvailable } from "../../lib/globe/webgl";
import { $selection, selectCountry } from "../../stores/location";
import { $preferences, setAutoRotate } from "../../stores/preferences";
import { $referenceInstant } from "../../stores/clock";
import type { City, Country } from "../../lib/geo/types";

const GlobeCanvas = lazy(() => import("./GlobeCanvas"));
const Globe2DFallback = lazy(() => import("./Globe2DFallback"));

interface GlobeHostProps {
  citiesById: Map<number, City>;
  countriesByCode: Map<string, Country>;
}

type Mode = "detecting" | "globe" | "fallback" | "error";

export default function GlobeHost({ citiesById, countriesByCode }: GlobeHostProps) {
  const [mode, setMode] = useState<Mode>("detecting");
  const [boundaries, setBoundaries] = useState<BoundaryCollection | null>(null);
  const [boundariesError, setBoundariesError] = useState(false);
  const selection = useStore($selection);
  const { autoRotate } = useStore($preferences);
  const referenceInstant = useStore($referenceInstant);
  const [flySignal, setFlySignal] = useState(0);

  useEffect(() => {
    setMode(isWebGLAvailable() ? "globe" : "fallback");
  }, []);

  useEffect(() => {
    if (mode !== "globe" && mode !== "fallback") return;
    let cancelled = false;
    getBoundaries()
      .then((data) => {
        if (!cancelled) setBoundaries(data);
      })
      .catch(() => {
        if (!cancelled) setBoundariesError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const marker = useMemo(() => {
    if (selection?.type === "city") {
      const city = citiesById.get(selection.id);
      const country = city ? countriesByCode.get(city.country) : undefined;
      return city ? { lat: city.lat, lon: city.lon, label: `${city.name}, ${country?.name || city.country}` } : null;
    }
    if (selection?.type === "country") {
      const country = countriesByCode.get(selection.code);
      if (!country) return null;
      const representative = citiesById.get(country.capitalCityId ?? country.representativeCityIds[0]);
      if (representative) return { lat: representative.lat, lon: representative.lon, label: country.name };
      const boundary = boundaries?.features.find(feature => feature.properties.code === selection.code);
      if (boundary) {
        const [lon, lat] = geoCentroid(boundary);
        if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon, label: country.name };
      }
    }
    return null;
  }, [selection, citiesById, countriesByCode, boundaries]);

  const selectedCountryCode = useMemo(() => {
    if (selection?.type === "country") return selection.code;
    if (selection?.type === "city") return citiesById.get(selection.id)?.country ?? null;
    return null;
  }, [selection, citiesById]);

  // Fly the camera whenever a *new* city selection is made (not on every reference-instant tick).
  const flyKey = marker ? `${selection?.type}-${marker.label}-${marker.lat}-${marker.lon}` : null;
  useEffect(() => {
    if (flyKey) setFlySignal((n) => n + 1);
  }, [flyKey]);

  function handleSelectCountry(feature: { code: string | null; name: string } | null) {
    if (!feature || !feature.code) return;
    if (countriesByCode.has(feature.code)) {
      selectCountry(feature.code);
    }
  }

  if (mode === "detecting" || (!boundaries && !boundariesError)) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
        Loading the globe…
      </div>
    );
  }

  if (boundariesError || mode === "error" || !boundaries) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-300">
        <p>The interactive globe couldn't be loaded right now.</p>
        <p className="text-slate-400">
          Search, clocks, and comparisons above still work normally — this only affects the
          visual globe.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            Loading the globe…
          </div>
        }
      >
        {mode === "globe" ? (
          <GlobeCanvas
            boundaries={boundaries}
            marker={marker}
            selectedCountryCode={selectedCountryCode}
            referenceInstant={referenceInstant}
            autoRotate={autoRotate}
            flyToSignal={flySignal}
            onSelectCountry={handleSelectCountry}
            onContextLost={() => setMode("fallback")}
          />
        ) : (
          <Globe2DFallback
            boundaries={boundaries}
            marker={marker}
            selectedCountryCode={selectedCountryCode}
            referenceInstant={referenceInstant}
            onSelectCountry={handleSelectCountry}
          />
        )}
      </Suspense>

      {mode === "globe" && (
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          aria-pressed={autoRotate}
          className="absolute bottom-3 right-3 rounded-md border border-slate-600 bg-slate-950/80 px-2.5 py-1.5 text-xs text-slate-200 backdrop-blur-sm hover:text-white"
        >
          {autoRotate ? "Pause rotation" : "Resume rotation"}
        </button>
      )}
    </div>
  );
}
