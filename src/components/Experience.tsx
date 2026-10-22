import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { useGeoData } from "../lib/hooks/useGeoData";
import { useSelectionAnnouncement } from "../lib/hooks/useSelectionAnnouncement";
import { $selection } from "../stores/location";
import { initPreferences } from "../stores/preferences";
import { startClock } from "../stores/clock";
import SearchCombobox from "./search/SearchCombobox";
import ExampleCities from "./search/ExampleCities";
import ClockCard from "./clock/ClockCard";
import DeviceClock from "./clock/DeviceClock";
import HourFormatToggle from "./clock/HourFormatToggle";
import ComparisonTray from "./clock/ComparisonTray";
import CountryPanel from "./country/CountryPanel";
import GlobeHost from "./globe/GlobeHost";
import TimeExplorer from "./explorer/TimeExplorer";

export default function Experience() {
  const geo = useGeoData(true);
  const selection = useStore($selection);

  useEffect(() => {
    initPreferences();
    startClock();
  }, []);

  const selectedCity = selection?.type === "city" ? geo.citiesById.get(selection.id) : undefined;
  const selectedCountry = selection?.type === "country" ? geo.countriesByCode.get(selection.code) : undefined;
  const announcement = useSelectionAnnouncement(selectedCity, selectedCountry);

  return (
    <div className="flex flex-col gap-6">
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>

      <div className="atlas-search rounded-2xl border border-navy-700 bg-navy-800/40 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchCombobox />
          <HourFormatToggle />
        </div>
        {!selectedCity && !selectedCountry && geo.status === "ready" && (
          <div className="mt-4">
            <ExampleCities citiesById={geo.citiesById} />
          </div>
        )}
      </div>

      <div className="atlas-workspace">
        <div className="atlas-clock-column">
          <div className="atlas-device"><span className="atlas-section-label">YOUR REFERENCE POINT</span><DeviceClock /></div>
          {selectedCity ? <ClockCard city={selectedCity} /> : selectedCountry ? <CountryPanel country={selectedCountry} citiesById={geo.citiesById} /> : <div className="atlas-empty"><span className="empty-globe" aria-hidden="true">◎</span><p className="atlas-section-label">A DIFFERENT PERSPECTIVE</p><h2>Your next connection<br />starts somewhere.</h2><p>Search for a city or select a country on the globe to discover its local time.</p><div className="empty-coordinates" aria-hidden="true">LATITUDE · LONGITUDE · LOCAL TIME</div></div>}
          <p className="atlas-clock-note">Times follow your device clock. Select a city for its exact time zone.</p>
        </div>
        <div className="atlas-earth-stage">
          <div className="earth-stage-label"><span className="earth-label-dot"></span> EARTH EXPLORER <span className="earth-stage-badge">INTERACTIVE 3D</span></div>
          <div className="atlas-earth-canvas">{geo.status === "ready" && <GlobeHost citiesById={geo.citiesById} countriesByCode={geo.countriesByCode} />}</div>
          <div className="earth-stage-footer"><span>Drag to explore · Scroll to zoom</span><span>Hover to pause</span></div>
        </div>
      </div>

      {geo.status === "ready" && <ComparisonTray citiesById={geo.citiesById} />}

      <TimeExplorer />

    </div>
  );
}
