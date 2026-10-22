import { useEffect, useState } from "react";
import type { City, Country } from "../geo/types";

/** A polite-live-region announcement string for screen readers whenever the selected city or
 *  country changes — selection changes are the "important result" worth announcing, not the
 *  ticking clock itself. */
export function useSelectionAnnouncement(selectedCity?: City, selectedCountry?: Country): string {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (selectedCity) {
      setAnnouncement(`Selected ${selectedCity.name}, ${selectedCity.country}.`);
    } else if (selectedCountry) {
      setAnnouncement(`Selected ${selectedCountry.name}.`);
    }
  }, [selectedCity?.id, selectedCountry?.code]);

  return announcement;
}
