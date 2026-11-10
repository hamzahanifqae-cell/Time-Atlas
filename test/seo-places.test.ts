import { describe, expect, it } from "vitest";
import { placeDescription, places } from "../src/lib/seo/places";
import { isIndexableSitemapUrl } from "../src/lib/seo/sitemapFilter";
import { exampleBusinessHours, gapSentence, newYorkEveningInTokyo, offsetLabel, SAMPLE_DATES } from "../src/lib/seo/zoneSamples";

const january = SAMPLE_DATES[0].ms;
const march = SAMPLE_DATES[1].ms;
const july = SAMPLE_DATES[2].ms;

describe("city time pages", () => {
  it("uses a unique slug and IANA zone for each place", () => {
    expect(new Set(places.map((place) => place.slug)).size).toBe(places.length);
    expect(places.map((place) => place.zone)).toEqual([
      "Europe/London",
      "America/New_York",
      "America/Los_Angeles",
      "Asia/Dubai",
      "Asia/Kolkata",
      "Asia/Tokyo",
      "Australia/Sydney",
    ]);
  });

  it("describes sample offsets, not a live clock reading", () => {
    for (const place of places) {
      const description = placeDescription(place);
      expect(description).toContain(place.zone);
      expect(description).not.toMatch(/\b\d{1,2}:\d{2}\s*(am|pm)\b/i);
      expect(description.toLowerCase()).not.toContain("right now");
    }
  });
});

describe("IANA sample offsets", () => {
  it("keeps London and New York five hours apart outside the mismatch weeks, and four hours in mid-March", () => {
    expect(offsetLabel("Europe/London", january)).toBe("UTC");
    expect(offsetLabel("Europe/London", march)).toBe("UTC");
    expect(offsetLabel("Europe/London", july)).toBe("UTC+1");
    expect(offsetLabel("America/New_York", january)).toBe("UTC−5");
    expect(offsetLabel("America/New_York", march)).toBe("UTC−4");
    expect(offsetLabel("America/New_York", july)).toBe("UTC−4");
    expect(gapSentence("New York", "London", "Europe/London", "America/New_York", january)).toBe(
      "New York is 5h behind London",
    );
    expect(gapSentence("New York", "London", "Europe/London", "America/New_York", march)).toBe(
      "New York is 4h behind London",
    );
    expect(gapSentence("New York", "London", "Europe/London", "America/New_York", july)).toBe(
      "New York is 5h behind London",
    );
  });

  it("does not treat India, Dubai, or Tokyo as daylight-saving zones", () => {
    expect(offsetLabel("Asia/Kolkata", january)).toBe("UTC+5:30");
    expect(offsetLabel("Asia/Kolkata", july)).toBe("UTC+5:30");
    expect(offsetLabel("Asia/Dubai", january)).toBe("UTC+4");
    expect(offsetLabel("Asia/Dubai", july)).toBe("UTC+4");
    expect(offsetLabel("Asia/Tokyo", january)).toBe("UTC+9");
    expect(offsetLabel("Asia/Tokyo", july)).toBe("UTC+9");
    expect(gapSentence("Tokyo", "New York", "America/New_York", "Asia/Tokyo", january)).toBe(
      "Tokyo is 14h ahead of New York",
    );
    expect(gapSentence("Tokyo", "New York", "America/New_York", "Asia/Tokyo", july)).toBe(
      "Tokyo is 13h ahead of New York",
    );
  });

  it("keeps Los Angeles three hours from New York, and widens the Honolulu gap in July", () => {
    for (const ms of [january, march, july]) {
      expect(gapSentence("New York", "Los Angeles", "America/Los_Angeles", "America/New_York", ms)).toBe(
        "New York is 3h ahead of Los Angeles",
      );
    }
    expect(gapSentence("Honolulu", "Los Angeles", "America/Los_Angeles", "Pacific/Honolulu", january)).toBe(
      "Honolulu is 2h behind Los Angeles",
    );
    expect(gapSentence("Honolulu", "Los Angeles", "America/Los_Angeles", "Pacific/Honolulu", july)).toBe(
      "Honolulu is 3h behind Los Angeles",
    );
  });

  it("changes the London gap for Dubai and Mumbai only because London moves", () => {
    expect(gapSentence("Dubai", "London", "Europe/London", "Asia/Dubai", january)).toBe(
      "Dubai is 4h ahead of London",
    );
    expect(gapSentence("Dubai", "London", "Europe/London", "Asia/Dubai", july)).toBe(
      "Dubai is 3h ahead of London",
    );
    expect(gapSentence("Mumbai", "London", "Europe/London", "Asia/Kolkata", january)).toBe(
      "Mumbai is 5h 30m ahead of London",
    );
    expect(gapSentence("Mumbai", "London", "Europe/London", "Asia/Kolkata", july)).toBe(
      "Mumbai is 4h 30m ahead of London",
    );
  });

  it("names Sydney AEST in July and AEDT in January, and rolls a morning into the previous New York date", () => {
    const sydney = places.find((place) => place.slug === "sydney");
    expect(sydney?.title).toBe("Sydney Time Zone: AEST or AEDT?");
    expect(placeDescription(sydney!)).toContain("AEDT");
    expect(placeDescription(sydney!)).toContain("AEST");
    expect(placeDescription(sydney!)).not.toMatch(/\b\d{1,2}:\d{2}\s*(am|pm)\b/i);

    const januaryMorning = exampleBusinessHours("Australia/Sydney", "America/New_York", 2026, 1, 15);
    expect(januaryMorning.localLabel).toBe("09:00 on 15 January 2026");
    expect(januaryMorning.otherLabel).toBe("17:00 on 14 January 2026");
    expect(januaryMorning.dateChanged).toBe(true);

    const julyMorning = exampleBusinessHours("Australia/Sydney", "America/New_York", 2026, 7, 15);
    expect(julyMorning.otherLabel).toBe("19:00 on 14 July 2026");
    expect(julyMorning.dateChanged).toBe(true);

    const brisbaneJanuary = exampleBusinessHours("Australia/Sydney", "Australia/Brisbane", 2026, 1, 15);
    expect(brisbaneJanuary.otherLabel).toBe("08:00 on 15 January 2026");
    expect(brisbaneJanuary.dateChanged).toBe(false);
  });

  it("puts Sydney one hour ahead of Brisbane in January and level in July", () => {
    expect(offsetLabel("Australia/Sydney", january)).toBe("UTC+11");
    expect(offsetLabel("Australia/Sydney", july)).toBe("UTC+10");
    expect(offsetLabel("Australia/Brisbane", january)).toBe("UTC+10");
    expect(offsetLabel("Australia/Brisbane", july)).toBe("UTC+10");
    expect(gapSentence("Brisbane", "Sydney", "Australia/Sydney", "Australia/Brisbane", january)).toBe(
      "Brisbane is 1h behind Sydney",
    );
    expect(gapSentence("Brisbane", "Sydney", "Australia/Sydney", "Australia/Brisbane", july)).toBe(
      "Brisbane matches Sydney",
    );
  });

  it("converts example 09:00 business hours, including a date change", () => {
    const londonJanuary = exampleBusinessHours("Europe/London", "America/New_York", 2026, 1, 15);
    expect(londonJanuary.localLabel).toBe("09:00 on 15 January 2026");
    expect(londonJanuary.otherLabel).toBe("04:00 on 15 January 2026");
    expect(londonJanuary.dateChanged).toBe(false);

    const londonJuly = exampleBusinessHours("Europe/London", "America/New_York", 2026, 7, 15);
    expect(londonJuly.otherLabel).toBe("04:00 on 15 July 2026");

    const tokyoMorning = exampleBusinessHours("Asia/Tokyo", "America/New_York", 2026, 1, 15);
    expect(tokyoMorning.localLabel).toBe("09:00 on 15 January 2026");
    expect(tokyoMorning.otherLabel).toBe("19:00 on 14 January 2026");
    expect(tokyoMorning.dateChanged).toBe(true);
  });

  it("shows an evening in New York as the next calendar date in Tokyo", () => {
    const example = newYorkEveningInTokyo();
    expect(example.newYork).toBe("22:00 on 15 January 2026");
    expect(example.tokyo).toBe("12:00 on 16 January 2026");
    expect(example.nextCalendarDate).toBe(true);
  });
});

describe("sitemap filter", () => {
  it("keeps canonical HTML pages and drops non-pages", () => {
    expect(isIndexableSitemapUrl("https://time-atlas.online/time/london/")).toBe(true);
    expect(isIndexableSitemapUrl("https://time-atlas.online/")).toBe(true);
    expect(isIndexableSitemapUrl("https://time-atlas.online/404/")).toBe(false);
    expect(isIndexableSitemapUrl("https://time-atlas.online/404.html")).toBe(false);
    expect(isIndexableSitemapUrl("https://time-atlas.online/ads.txt")).toBe(false);
    expect(isIndexableSitemapUrl("https://time-atlas.online/robots.txt")).toBe(false);
  });
});
