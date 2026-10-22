#!/usr/bin/env node
/**
 * Builds src/data/generated/{cities.json,countries.json,timezones.json} from the raw
 * GeoNames + IANA tzdb files in data/raw/. See /DATA_SOURCES.md for provenance.
 *
 * Methodology (documented here because it determines dataset coverage):
 *  - Base set: every GeoNames city with population >= 50,000.
 *  - Plus: every national capital (GeoNames feature code PPLC), regardless of population.
 *  - Plus: for every (country, IANA timezone) pair that actually occurs, at least one
 *    representative city (the highest-population GeoNames city in that country+timezone),
 *    even if it falls under the population threshold. This guarantees every timezone a
 *    multi-zone country exposes has a selectable, named city.
 *  - Plus: for every country code known to the IANA tzdb that still has zero cities after
 *    the above, the single largest GeoNames city for that country code (any population),
 *    so every supported country has at least one searchable location.
 *
 * This keeps the bundle well under the full ~34k-row GeoNames cities15000 extract while
 * still guaranteeing full country/timezone coverage. It is NOT a complete list of the
 * world's settlements — see DATA_SOURCES.md and the in-app coverage note.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { RAW_DIR, GENERATED_DIR } from "./lib/paths.mjs";
import path from "node:path";

const POP_THRESHOLD = 50_000;
const MAX_ALIASES = 5;

// A tiny number of GeoNames rows carry a timezone from the wrong country's zone because
// their coordinates sit close to a tz-boundary-polygon edge in GeoNames' own lookup.
// Each entry here is a correction to the right IANA zone for that place (never a fixed
// UTC offset) and is spelled out so it can be audited or removed as upstream data improves.
const TZ_CORRECTIONS = new Map([
  // Kota Sambas, West Kalimantan, Indonesia: GeoNames tags it Asia/Ho_Chi_Minh (Vietnam's
  // zone); West Kalimantan uses Indonesian Western Time, Asia/Jakarta. Same UTC+7 offset,
  // no DST in either zone, so this only affects the displayed zone name, not any clock.
  [13405902, "Asia/Jakarta"],
]);

function stripDiacritics(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const LATIN_ALIAS_RE = /^[A-Za-zÀ-ÖØ-öø-ſ'.\- ]+$/;

function filterAliases(alternateNamesRaw, name, asciiName) {
  if (!alternateNamesRaw) return [];
  const seen = new Set([name.toLowerCase(), asciiName.toLowerCase()]);
  const candidates = [];
  for (const raw of alternateNamesRaw.split(",")) {
    const alias = raw.trim();
    if (!alias || alias.length < 2 || alias.length > 40) continue;
    if (!LATIN_ALIAS_RE.test(alias)) continue;
    const key = stripDiacritics(alias).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(alias);
  }
  candidates.sort((a, b) => a.length - b.length || a.localeCompare(b));
  return candidates.slice(0, MAX_ALIASES);
}

async function loadAdmin1Names() {
  const text = await readFile(path.join(RAW_DIR, "admin1CodesASCII.txt"), "utf8");
  const map = new Map();
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const [code, name] = line.split("\t");
    map.set(code, name);
  }
  return map;
}

async function loadCountryInfo() {
  const text = await readFile(path.join(RAW_DIR, "countryInfo.txt"), "utf8");
  const CONTINENTS = {
    AF: "Africa",
    AS: "Asia",
    EU: "Europe",
    NA: "North America",
    OC: "Oceania",
    SA: "South America",
    AN: "Antarctica",
  };
  const map = new Map();
  for (const line of text.split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const cols = line.split("\t");
    const code = cols[0];
    const name = cols[4];
    const continentCode = cols[8];
    map.set(code, { name, continent: CONTINENTS[continentCode] ?? "Other" });
  }
  return map;
}

async function loadIso3166Names() {
  const text = await readFile(path.join(RAW_DIR, "iso3166.tab"), "utf8");
  const map = new Map();
  for (const line of text.split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [code, name] = line.split("\t");
    map.set(code, name);
  }
  return map;
}

async function loadZoneTable() {
  // zone1970.tab is only used as a fallback for the handful of country codes that have
  // zero cities in GeoNames (uninhabited/near-uninhabited territories): its row attributes
  // a shared zone to the FIRST (most populous) country in a comma list, so it is not a
  // reliable general-purpose country->timezones map (e.g. it omits IS and LU entirely,
  // folding them into other countries' rows via "#@" shorthand comments). The authoritative
  // per-country timezone list is instead derived directly from each GeoNames city's own tz
  // field in loadCities()/main(), which is self-consistent with the shipped city data.
  const text = await readFile(path.join(RAW_DIR, "zone1970.tab"), "utf8");
  const byCountry = new Map();
  const allZones = new Set();
  for (const line of text.split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const cols = line.split("\t");
    const codes = cols[0].split(",");
    const tz = cols[2];
    allZones.add(tz);
    for (const code of codes) {
      if (!byCountry.has(code)) byCountry.set(code, []);
      const list = byCountry.get(code);
      if (!list.includes(tz)) list.push(tz);
    }
  }
  return { byCountry, allZones };
}

async function loadCities(admin1Names) {
  const text = await readFile(path.join(RAW_DIR, "cities15000.txt"), "utf8");
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const c = line.split("\t");
    const id = Number(c[0]);
    const name = c[1];
    const asciiName = c[2];
    const alternateNames = c[3];
    const lat = Number(c[4]);
    const lon = Number(c[5]);
    const featureCode = c[7];
    const country = c[8];
    const admin1Code = c[10];
    const population = Number(c[14]) || 0;
    const tz = TZ_CORRECTIONS.get(id) ?? c[17];
    if (!tz || !country) continue;
    const admin1Key = admin1Code ? `${country}.${admin1Code}` : null;
    rows.push({
      id,
      name,
      ascii: asciiName,
      country,
      admin1: admin1Key ? admin1Names.get(admin1Key) ?? null : null,
      lat,
      lon,
      tz,
      pop: population,
      cap: featureCode === "PPLC",
      aliases: filterAliases(alternateNames, name, asciiName),
    });
  }
  return rows;
}

async function main() {
  await mkdir(GENERATED_DIR, { recursive: true });

  const [admin1Names, countryInfo, iso3166Names, { byCountry: zonesByCountry, allZones }] =
    await Promise.all([loadAdmin1Names(), loadCountryInfo(), loadIso3166Names(), loadZoneTable()]);

  const allCities = await loadCities(admin1Names);

  // Index all cities (pre-filter) by country+tz, and by country, for backfill lookups.
  // This is also the authoritative source for "which timezones does country X have" —
  // derived straight from each city's own GeoNames tz field, not from zone1970.tab (see
  // loadZoneTable() for why that table is unreliable as a general country->zones map).
  const byCountryTz = new Map();
  const byCountryAll = new Map();
  const tzsByCountry = new Map();
  for (const city of allCities) {
    const ctKey = `${city.country}|${city.tz}`;
    const prevCt = byCountryTz.get(ctKey);
    if (!prevCt || city.pop > prevCt.pop) byCountryTz.set(ctKey, city);

    const prevC = byCountryAll.get(city.country);
    if (!prevC || city.pop > prevC.pop) byCountryAll.set(city.country, city);

    if (!tzsByCountry.has(city.country)) tzsByCountry.set(city.country, new Set());
    tzsByCountry.get(city.country).add(city.tz);
  }

  const selected = new Map();
  for (const city of allCities) {
    if (city.pop >= POP_THRESHOLD || city.cap) selected.set(city.id, city);
  }

  // Guarantee a representative city for every (country, timezone) pair that occurs.
  for (const city of byCountryTz.values()) {
    selected.set(city.id, city);
  }

  // Guarantee at least one city for every country code the tzdb knows about.
  const allCountryCodes = new Set([...zonesByCountry.keys(), ...iso3166Names.keys()]);
  for (const code of allCountryCodes) {
    const hasOne = [...selected.values()].some((c) => c.country === code);
    if (!hasOne && byCountryAll.has(code)) {
      const c = byCountryAll.get(code);
      selected.set(c.id, c);
    }
  }

  const cities = [...selected.values()].sort((a, b) => b.pop - a.pop);

  // Build countries.json
  const citiesByCountry = new Map();
  for (const city of cities) {
    if (!citiesByCountry.has(city.country)) citiesByCountry.set(city.country, []);
    citiesByCountry.get(city.country).push(city);
  }

  const countries = [];
  for (const code of allCountryCodes) {
    const info = countryInfo.get(code);
    const name = info?.name ?? iso3166Names.get(code) ?? code;
    // Prefer timezones actually observed on GeoNames cities for this country; fall back to
    // zone1970.tab only for the handful of codes with zero GeoNames rows at all (e.g.
    // uninhabited territories like Antarctica or Bouvet Island).
    const derivedTimezones = tzsByCountry.get(code);
    const timezones = derivedTimezones
      ? [...derivedTimezones].sort()
      : (zonesByCountry.get(code) ?? []);
    const citiesHere = (citiesByCountry.get(code) ?? []).sort((a, b) => b.pop - a.pop);
    const capital = citiesHere.find((c) => c.cap) ?? null;

    const representativeCityIds = [];
    for (const tz of timezones) {
      const inZone = citiesHere.filter((c) => c.tz === tz);
      const best = inZone.sort((a, b) => b.pop - a.pop)[0];
      if (best) representativeCityIds.push(best.id);
    }

    countries.push({
      code,
      name,
      continent: info?.continent ?? "Other",
      timezones,
      multiZone: timezones.length > 1,
      capitalCityId: capital?.id ?? null,
      representativeCityIds,
      cityCount: citiesHere.length,
    });
  }
  countries.sort((a, b) => a.name.localeCompare(b.name));

  const cityOutput = cities.map((c) => ({
    id: c.id,
    name: c.name,
    ascii: c.ascii,
    country: c.country,
    admin1: c.admin1,
    lat: Math.round(c.lat * 10000) / 10000,
    lon: Math.round(c.lon * 10000) / 10000,
    tz: c.tz,
    pop: c.pop,
    cap: c.cap,
    aliases: c.aliases,
  }));

  await writeFile(path.join(GENERATED_DIR, "cities.json"), JSON.stringify(cityOutput));
  await writeFile(path.join(GENERATED_DIR, "countries.json"), JSON.stringify(countries));
  await writeFile(
    path.join(GENERATED_DIR, "timezones.json"),
    JSON.stringify([...allZones].sort()),
  );

  console.log(`cities.json: ${cityOutput.length} cities (from ${allCities.length} raw rows)`);
  console.log(`countries.json: ${countries.length} countries`);
  console.log(`timezones.json: ${allZones.size} IANA timezones`);
  const multiZoneCount = countries.filter((c) => c.multiZone).length;
  console.log(`multi-timezone countries: ${multiZoneCount}`);
  const missingRepresentative = countries.filter(
    (c) => c.timezones.length > 0 && c.representativeCityIds.length < c.timezones.length,
  );
  if (missingRepresentative.length) {
    console.warn(
      "WARNING: countries missing a representative city for at least one timezone:",
      missingRepresentative.map((c) => c.code).join(", "),
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
