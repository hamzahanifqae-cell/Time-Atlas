import { describe, it, expect } from 'vitest';
import { cityLocationHints } from '../src/lib/geo/display';
import type { City } from '../src/lib/geo/types';
const town: City = { id: 1, name: 'Sahiwal', ascii: 'Sahiwal', country: 'PK', admin1: 'Punjab', lat: 31.9739, lon: 72.3311, tz: 'Asia/Karachi', pop: 1000, cap: false, aliases: [] };
describe('same-named city labels', () => {
  it('distinguishes different places in the same country and province', () => {
    const hints = cityLocationHints([town, { ...town, id: 2, lat: 30.666, lon: 73.1019 }]);
    expect(hints.get(1)).toBe('31.97°N, 72.33°E');
    expect(hints.get(2)).toBe('30.67°N, 73.10°E');
  });
  it('does not treat a repeated ID as another settlement', () => {
    expect(cityLocationHints([town, town]).size).toBe(0);
  });
  it('needs no coordinates when region labels distinguish the places', () => {
    expect(cityLocationHints([town, { ...town, id: 3, admin1: 'Sindh' }]).size).toBe(0);
  });
});
