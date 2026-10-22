import type { City, Country } from "../../lib/geo/types";
import { selectCity } from "../../stores/location";
import ClockCard from "../clock/ClockCard";

interface CountryPanelProps {
  country: Country;
  citiesById: Map<number, City>;
}

export default function CountryPanel({ country, citiesById }: CountryPanelProps) {
  const representativeCities = country.representativeCityIds
    .map((id) => citiesById.get(id))
    .filter((c): c is City => c !== undefined);

  return (
    <div className="rounded-2xl border border-navy-700 bg-navy-800/60 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-paper-100">{country.name}</h2>
      <p className="text-sm text-paper-400">{country.continent}</p>

      {country.multiZone ? (
        <>
          <p className="mt-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
            {country.name} spans {country.timezones.length} time zones. There's no single
            "{country.name} time" — choose a city below to see its local time.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {representativeCities.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => selectCity(city.id)}
                  className="w-full rounded-lg border border-navy-600 bg-navy-900/40 p-1 text-left hover:border-cyan-600/50"
                  aria-label={`Show local time in ${city.name}, representative of ${city.tz}`}
                >
                  <ClockCard city={city} variant="compact" />
                </button>
              </li>
            ))}
          </ul>
          {representativeCities.length < country.timezones.length && (
            <p className="mt-3 text-xs text-paper-600">
              {country.timezones.length - representativeCities.length} additional time zone(s)
              in {country.name} have no city in our dataset large enough to list (see{" "}
              <a href="/guide#coverage" className="underline hover:text-paper-400">
                coverage notes
              </a>
              ).
            </p>
          )}
        </>
      ) : representativeCities.length > 0 ? (
        <div className="mt-4">
          <ClockCard city={representativeCities[0]} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-paper-400">
          No city in our dataset for {country.name} — see{" "}
          <a href="/guide#coverage" className="underline hover:text-paper-400">
            coverage notes
          </a>
          .{" "}
          {country.timezones[0] && (
            <>
              Its time zone is <span className="tabular">{country.timezones[0]}</span>.
            </>
          )}
        </p>
      )}

      <p className="mt-4 text-xs text-paper-600">
        {country.cityCount} {country.cityCount === 1 ? "city" : "cities"} from this country are
        in TimeAtlas's dataset — see the{" "}
        <a href="/guide#coverage" className="underline hover:text-paper-400">
          coverage notes
        </a>{" "}
        for what that does and doesn't include.
      </p>
    </div>
  );
}
