#!/usr/bin/env node
/**
 * Downloads the raw third-party source files TimeAtlas's data pipeline is built from.
 * Nothing here is shipped to the browser directly — `npm run data:build` reads these
 * raw files and produces the trimmed, self-hosted assets under src/data/generated/
 * and public/textures/.
 *
 * See /DATA_SOURCES.md for license and attribution details for each source.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.resolve(__dirname, "../../data/raw");

const SOURCES = [
  {
    name: "cities15000.zip",
    url: "https://download.geonames.org/export/dump/cities15000.zip",
    note: "GeoNames cities with population >= 15000 (CC BY 4.0)",
  },
  {
    name: "admin1CodesASCII.txt",
    url: "https://download.geonames.org/export/dump/admin1CodesASCII.txt",
    note: "GeoNames admin1 (region/state) code -> name table (CC BY 4.0)",
  },
  {
    name: "countryInfo.txt",
    url: "https://download.geonames.org/export/dump/countryInfo.txt",
    note: "GeoNames country metadata (CC BY 4.0)",
  },
  {
    name: "zone1970.tab",
    url: "https://raw.githubusercontent.com/eggert/tz/main/zone1970.tab",
    note: "IANA tzdb country-code -> timezone table (public domain)",
  },
  {
    name: "iso3166.tab",
    url: "https://raw.githubusercontent.com/eggert/tz/main/iso3166.tab",
    note: "IANA tzdb ISO 3166 country code -> English short name (public domain)",
  },
  {
    name: "countries.geojson",
    url: "https://raw.githubusercontent.com/datasets/geo-countries/main/data/countries.geojson",
    note: "Country polygons derived from Natural Earth 10m admin-0 (MIT packaging; source data public domain)",
  },
  {
    name: "geo-countries-LICENSE",
    url: "https://raw.githubusercontent.com/datasets/geo-countries/main/LICENSE",
  },
  {
    name: "geo-countries-ATTRIBUTION.txt",
    url: "https://raw.githubusercontent.com/datasets/geo-countries/main/ATTRIBUTION.txt",
  },
  {
    name: "earth-day-source.jpg",
    url: "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg",
    note: "NASA Visible Earth Blue Marble Next Generation, Dec 2004, 5400x2700 (public domain)",
  },
  {
    name: "earth-night-source.tif",
    url: "https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg_geo.tif",
    note: "NASA Earth Observatory Black Marble 2016, 0.1 degree, 3600x1800 (public domain)",
  },
];

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  for (const src of SOURCES) {
    const dest = path.join(RAW_DIR, src.name);
    process.stdout.write(`Fetching ${src.name} ... `);
    const res = await fetch(src.url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${src.url}: ${res.status} ${res.statusText}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(dest, buf);
    console.log(`${(buf.length / 1024).toFixed(0)} KB`);
  }
  console.log("\nDone. Raw sources are in data/raw/ (gitignored). Run `npm run data:build` next.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
