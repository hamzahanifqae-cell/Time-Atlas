# Data sources, licensing, and attribution

Everything below was fetched on **2026-10-21** and is reproducible via `npm run data:fetch`
followed by `npm run data:build` (see `scripts/data/`). Raw downloads live in `data/raw/`
(gitignored — regenerate them, don't commit them); their SHA-256 checksums as of that date are
in `data/raw-checksums.txt`.

## Cities, regions, country metadata — GeoNames

- **Source:** [GeoNames.org](https://www.geonames.org/) `cities15000` export, `admin1CodesASCII.txt`, and `countryInfo.txt`, from `https://download.geonames.org/export/dump/`.
- **License:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). **Attribution is required**: "City and region data from GeoNames.org, licensed under CC BY 4.0." (This appears in the site footer and on the About page.)
- **What it is:** `cities15000` is every GeoNames place with a recorded population of 15,000 or more — about 34,000 rows worldwide, each with name, ASCII name, alternate names, coordinates, country, admin1 (region/state) code, population, feature code, and an IANA time zone identifier already assigned by GeoNames.
- **What TimeAtlas ships (not the full extract):** `public/data/cities.json` is a filtered,
  trimmed subset — see "Dataset methodology" below for exactly how it's selected. It is **not**
  a complete list of the world's settlements; see the in-app coverage notes (`/guide#coverage`).

## Country ↔ timezone relationships — IANA Time Zone Database (tzdb)

- **Source:** `zone1970.tab` and `iso3166.tab` from the IANA tzdb's canonical public mirror, `https://raw.githubusercontent.com/eggert/tz/main/`.
- **License:** Public domain (explicitly stated in the files themselves).
- **What it's used for:** `iso3166.tab` supplements GeoNames' country names for codes GeoNames
  doesn't otherwise name. `zone1970.tab` is used **only** as a fallback for the handful of
  country codes with zero GeoNames cities at any population (uninhabited territories) — the
  primary country→timezone mapping is derived directly from which IANA zone each shipped
  city actually uses (see methodology below for why).

## Country boundaries — Natural Earth, via datasets/geo-countries

- **Source:** [Natural Earth](https://www.naturalearthdata.com/) 10m Admin-0 Countries, packaged as GeoJSON by [`datasets/geo-countries`](https://github.com/datasets/geo-countries) (`data/countries.geojson`, fetched from that repo's `main` branch).
- **License:** The underlying Natural Earth data is public domain ("No permission is needed to use Natural Earth... Crediting the authors is unnecessary," per [Natural Earth's terms of use](https://www.naturalearthdata.com/about/terms-of-use/)). The `geo-countries` packaging itself is **MIT licensed**.
- **Simplification:** Natural Earth's 10m resolution is far more detail than a web globe
  needs — simplified with a small in-repo Visvalingam-Whyatt implementation
  (`scripts/data/lib/simplify.mjs`), not a general-purpose GIS tool. See "A data-quality bug
  found and fixed while building this" below for why a custom simplifier was used instead of
  `mapshaper`.
- **Disputed/uninhabited areas:** ~20 features (Kosovo, Somaliland, Northern Cyprus, Antarctic
  claims, a handful of small disputed islands/reefs) have no ISO 3166-1 code in Natural
  Earth's data. TimeAtlas still draws them (so the globe's landmass looks complete) but treats
  them as non-selectable (no linked time zone data). Natural Earth documents its own
  conventions for disputed/de facto boundaries; TimeAtlas draws the data as published and does
  not intend this as a political statement.

## Earth textures — NASA (public domain)

- **Day texture:** NASA Visible Earth, "Blue Marble Next Generation," December 2004 composite, `world.topo.bathy.200412.3x5400x2700.jpg` — `https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/`.
- **Night texture:** NASA Earth Observatory, "Black Marble" 2016, 0.1°-resolution GeoTIFF, `BlackMarble_2016_01deg_geo.tif` — `https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/`.
- **License:** Public domain (NASA imagery; works prepared by NASA are not copyrighted in the US). No attribution is legally required; TimeAtlas credits NASA anyway, on the About page, as good practice.
- **Processing:** resized to 2048×1024 and re-compressed as JPEG via `sharp` (`scripts/data/build-textures.mjs`) — the shipped files are **not** the original NASA files and are not suitable for scientific use; they're sized for a web texture.
- These are **not** satellite imagery of the current sky or a live feed — see `/guide#globe`.

## Fonts

- **Inter**, loaded from Google Fonts at runtime (`https://fonts.googleapis.com`). Open Font License. Not self-hosted; this is the one piece of TimeAtlas that makes a request to a third party at runtime (see `/privacy`).

## Code dependencies of note

- **Luxon** (time-zone-aware date/time math) and **Fuse.js** (fuzzy search) — both MIT licensed, both bundled, neither is a network service.
- **Three.js** (3D globe rendering) and **d3-geo** (map projection / spherical geometry for the 2D fallback and country point-in-polygon tests) — both MIT licensed.

---

## Dataset methodology (why `cities.json` has ~12,500 rows, not ~34,000)

`scripts/data/build-geo.mjs` selects:

1. Every city with GeoNames population ≥ 50,000.
2. Every national capital (GeoNames feature code `PPLC`), regardless of population.
3. For every `(country, IANA timezone)` pair that actually occurs among GeoNames cities, the
   highest-population city in that pair — so every timezone a multi-zone country exposes has
   at least one named, selectable city, even if it falls under the population threshold.
4. For any country code known to the IANA tzdb that still has zero cities after the above
   (true for a handful of near-uninhabited territories), the single largest GeoNames city for
   that code, at any population.

This keeps the shipped dataset well under half the size of the full `cities15000` extract
while guaranteeing complete country and timezone coverage. It is intentionally **not** every
settlement in the world — see `/guide#coverage` for the user-facing version of this.

Country timezone lists (`countries.json`'s `timezones` field) are derived directly from the
distinct IANA zones actually used by that country's GeoNames cities — not from `zone1970.tab`.
`zone1970.tab` turned out to be unreliable as a general country→timezone map for this purpose:
it uses a shorthand (`#@` comment lines) to fold some countries' zones into another country's
row, and parsing it the straightforward way silently produced an **empty** timezone list for
countries like Iceland and Luxembourg. Deriving the list from the cities actually being
shipped is simpler and self-consistent by construction.

One single GeoNames row (`Kota Sambas`, West Kalimantan, Indonesia, geonameid `13405902`) is
corrected from `Asia/Ho_Chi_Minh` to `Asia/Jakarta` — a GeoNames coordinate-to-timezone-polygon
assignment that lands just across a tz-boundary edge. Both zones share the same UTC+7 offset
with no DST in either, so this only affects the *displayed* zone name, never any clock. This
is a one-row correction to the correct IANA identifier, not a fixed-offset override; see the
`TZ_CORRECTIONS` map in `scripts/data/build-geo.mjs`.

## A data-quality bug found and fixed while building this

Worth recording in detail, since it would be easy to reintroduce while "improving"
the simplification: the country-boundary pipeline originally ran Natural Earth's data
through `mapshaper` (`-simplify ... -clean rewind`), which is the standard tool for this.
That produced geometry where `d3-geo`'s spherical `geoContains`/`geoArea` — used for
click-to-select-country on the globe — read **several countries, including Indonesia and
Germany, as containing almost the entire globe** (a geoArea near or above 4π steradians,
a full sphere's solid angle). Confirmed by isolating the exact step: Indonesia's ~264-part
archipelago was being restructured down to ~103 parts during `mapshaper`'s simplification,
and the result was no longer well-behaved under `d3-geo`'s spherical math, in either winding
direction.

The fix was to replace that step with a small from-scratch per-ring Visvalingam-Whyatt
simplifier (`scripts/data/lib/simplify.mjs`) that never restructures a polygon's parts, with
two additional safeguards discovered empirically while chasing this:

- It never reduces any ring below a minimum vertex count, and falls back to a target ring's
  original points if the simplified version is self-intersecting. (A very small, few-vertex,
  irregular polygon can make `d3-geo`'s spherical area algorithm lose essentially all
  precision to floating-point cancellation, in a way that has nothing to do with winding
  direction — regular shapes at the same scale are fine; only irregular low-vertex-count ones
  are affected.)
- `build-boundaries.mjs` sanity-checks every output feature's `geoArea` against its original
  value before writing `boundaries.geojson`, and refuses to write the file (non-zero exit) if
  anything looks implausible — so this class of bug can't ship silently again. `test/boundary-simplify.test.ts` and `test/geo-boundaries.test.ts` pin the specific cases found.
