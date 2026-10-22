import { selectCity } from "../../stores/location";
import type { City } from "../../lib/geo/types";

const EXAMPLE_CITY_IDS = [2643743, 5128581, 1850147, 2147714, 292223, 3448439, 1275339, 2193733];

interface ExampleCitiesProps {
  citiesById: Map<number, City>;
}

export default function ExampleCities({ citiesById }: ExampleCitiesProps) {
  const cities = EXAMPLE_CITY_IDS.map((id) => citiesById.get(id)).filter((c): c is City => Boolean(c));
  if (cities.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium text-paper-600">Or try an example:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {cities.map((city) => (
          <button
            key={city.id}
            type="button"
            onClick={() => selectCity(city.id)}
            className="rounded-full border border-navy-600 bg-navy-800 px-3 py-1.5 text-sm text-paper-200 hover:border-cyan-600/50 hover:text-paper-100"
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
}
