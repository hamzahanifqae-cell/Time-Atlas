import type { City } from './types';
import { normalize } from '../search/normalize';

export function cityCoordinates(city: City): string {
  return `${Math.abs(city.lat).toFixed(2)}°${city.lat < 0 ? 'S' : 'N'}, ${Math.abs(city.lon).toFixed(2)}°${city.lon < 0 ? 'W' : 'E'}`;
}

/** Same-named settlements are not duplicates merely because they share a province.
 * Keep their stable GeoNames IDs and expose coordinates when region labels also collide. */
export function cityLocationHints(cities: City[]): Map<number, string> {
  const groups = new Map<string, City[]>();
  for (const city of cities) {
    const key = `${normalize(city.name)}|${city.country}|${normalize(city.admin1 ?? '')}`;
    const group = groups.get(key) ?? [];
    group.push(city); groups.set(key, group);
  }
  const hints = new Map<number, string>();
  for (const group of groups.values()) if (new Set(group.map(city => city.id)).size > 1) {
    for (const city of group) hints.set(city.id, cityCoordinates(city));
  }
  return hints;
}
