/** A searchable, selectable location. Generated from GeoNames — see /DATA_SOURCES.md. */
export interface City {
  /** GeoNames geonameid — stable, used as the persisted identifier for saved cities. */
  id: number;
  /** Display name, original script/diacritics. */
  name: string;
  /** ASCII transliteration, used for accent-insensitive matching. */
  ascii: string;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
  /** Region/state name, when GeoNames provides one. */
  admin1: string | null;
  lat: number;
  lon: number;
  /** IANA time zone identifier. */
  tz: string;
  /** Population, for ranking and "largest city" fallbacks. Not displayed as a precise fact. */
  pop: number;
  /** Whether GeoNames tags this as a national capital (PPLC). */
  cap: boolean;
  /** A handful of common Latin-script aliases, e.g. abbreviations or anglicizations. */
  aliases: string[];
}

/** A country/territory and the time zone(s) it observes. */
export interface Country {
  /** ISO 3166-1 alpha-2 code. */
  code: string;
  name: string;
  continent: string;
  /** All distinct IANA zones actually in use by cities in this dataset for this country. */
  timezones: string[];
  /** True when this country spans more than one time zone. */
  multiZone: boolean;
  capitalCityId: number | null;
  /** One representative city id per timezone in `timezones`, where one exists in-dataset. */
  representativeCityIds: number[];
  /** How many cities from this dataset belong to this country (coverage hint). */
  cityCount: number;
}

export interface CountryBoundaryProperties {
  /** ISO 3166-1 alpha-2 code, or null for disputed/uninhabited areas with no ISO code. */
  code: string | null;
  code3: string | null;
  name: string;
}
