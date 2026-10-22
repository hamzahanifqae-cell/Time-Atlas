/**
 * A small, hand-curated list of very common country abbreviations/alt-names that fuzzy
 * matching alone wouldn't catch (acronyms aren't typo-distance from the full name). This is
 * deliberately short — it is a supplement for well-known cases, not an exhaustive synonym
 * dictionary.
 */
export const COUNTRY_ALIASES: Record<string, string[]> = {
  US: ["USA", "United States of America", "America"],
  GB: ["UK", "United Kingdom", "Britain", "Great Britain"],
  AE: ["UAE", "Emirates"],
  KR: ["South Korea"],
  KP: ["North Korea"],
  CZ: ["Czechia"],
  NL: ["Holland"],
  RU: ["Russian Federation"],
  LA: ["Laos"],
  CI: ["Ivory Coast"],
  CD: ["DRC", "Congo-Kinshasa", "DR Congo"],
  CG: ["Congo-Brazzaville"],
  SZ: ["Swaziland"],
  MK: ["Macedonia"],
  TR: ["Turkiye"],
  MM: ["Burma"],
  VA: ["Vatican"],
  BA: ["Bosnia"],
  TW: ["Taiwan"],
  HK: ["Hong Kong"],
  VN: ["Viet Nam"],
};
