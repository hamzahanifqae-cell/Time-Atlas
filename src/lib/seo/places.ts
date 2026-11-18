import { offsetLabel, SAMPLE_DATES } from "./zoneSamples";

export interface PlaceComparison {
  name: string;
  zone: string;
  href?: string;
}

export interface PlaceFaq {
  question: string;
  answer: string;
}

export interface Place {
  slug: string;
  name: string;
  /** City plus the country or region that distinguishes it. */
  regionLabel: string;
  zone: string;
  /** One sentence naming the place this page is not. */
  notTheSameAs: string;
  /** Why this zone is worth its own page. No clock reading, no fixed "current" offset. */
  explanation: string;
  /** Document title when the default "Time in {place}" title does not match the query. */
  title?: string;
  /** Visible H1 when it should differ from "Time in {place}". */
  heading?: string;
  /** Short line under the explanation that points to the live clock. */
  currentTimeNote?: string;
  comparisons: PlaceComparison[];
  faqs: PlaceFaq[];
}

export const places: Place[] = [
  {
    slug: "london",
    name: "London",
    regionLabel: "London, England",
    zone: "Europe/London",
    notTheSameAs: "This is London, England, not London, Ontario.",
    explanation:
      "London uses Europe/London. In winter that is Greenwich Mean Time at UTC+0, as on 15 January 2026. In summer it is British Summer Time at UTC+1, as on 15 July 2026. The United States starts daylight saving earlier than the UK, so on 15 March 2026 New York is already on Eastern Daylight Time while London is still on GMT. That is why a 09:00 London meeting is 04:00 in New York on the January and July sample dates, but 05:00 in New York on 15 March 2026. London, Ontario, uses America/Toronto and is not this zone.",
    comparisons: [{ name: "New York", zone: "America/New_York", href: "/time/new-york/" }],
    faqs: [
      {
        question: "Does London observe daylight saving time?",
        answer:
          "Yes. Europe/London is on Greenwich Mean Time, UTC+0, in winter and British Summer Time, UTC+1, in summer. The table on this page lists the offset at noon UTC on three dates in 2026. It is not a live clock.",
      },
      {
        question: "Why is the London–New York gap different in March?",
        answer:
          "The US and the UK change clocks on different weekends. On 15 March 2026, America/New_York is already on daylight saving while Europe/London is still on GMT, so New York is four hours behind London. On the January and July sample dates the gap is five hours.",
      },
      {
        question: "Is this the time in London, Ontario?",
        answer:
          "No. London, Ontario, Canada, uses America/Toronto, the same IANA zone as Toronto. This page is London, England.",
      },
    ],
  },
  {
    slug: "new-york",
    name: "New York",
    regionLabel: "New York City, United States",
    zone: "America/New_York",
    notTheSameAs: "This is New York City, not York, England.",
    explanation:
      "New York City uses America/New_York. In winter that is Eastern Standard Time at UTC−5, as on 15 January 2026. In summer it is Eastern Daylight Time at UTC−4, as on 15 March and 15 July 2026. Tokyo does not change clocks, so the New York–Tokyo gap is 14 hours on the January sample and 13 hours on the July sample. A 09:00 New York morning is still the previous evening in Tokyo on those dates. York, England, uses Europe/London, not America/New_York.",
    comparisons: [
      { name: "London", zone: "Europe/London", href: "/time/london/" },
      { name: "Tokyo", zone: "Asia/Tokyo", href: "/time/tokyo/" },
    ],
    faqs: [
      {
        question: "Does New York observe daylight saving time?",
        answer:
          "Yes. America/New_York uses Eastern Standard Time, UTC−5, in winter and Eastern Daylight Time, UTC−4, in summer. Hawaii and most of Arizona do not follow that change. The table lists sample dates, not the current minute.",
      },
      {
        question: "Which New York is this?",
        answer:
          "New York City, United States, in the America/New_York zone. It is not York, England, which uses Europe/London.",
      },
    ],
  },
  {
    slug: "los-angeles",
    name: "Los Angeles",
    regionLabel: "Los Angeles, United States",
    zone: "America/Los_Angeles",
    notTheSameAs: "This is Los Angeles, California, in Pacific Time, not a city outside that zone.",
    explanation:
      "Los Angeles uses America/Los_Angeles. In winter that is Pacific Standard Time at UTC−8, as on 15 January 2026. In summer it is Pacific Daylight Time at UTC−7, as on 15 March and 15 July 2026. New York stays three hours ahead on those three dates, because both US zones change clocks on the same morning. Honolulu uses Pacific/Honolulu and does not observe daylight saving, so a 09:00 Los Angeles meeting is 07:00 in Honolulu on 15 January 2026 and 06:00 in Honolulu on 15 July 2026.",
    comparisons: [
      { name: "New York", zone: "America/New_York", href: "/time/new-york/" },
      { name: "Honolulu", zone: "Pacific/Honolulu" },
    ],
    faqs: [
      {
        question: "What time zone is Los Angeles in?",
        answer:
          "Los Angeles uses America/Los_Angeles. That is Pacific Standard Time, UTC−8, in winter and Pacific Daylight Time, UTC−7, in summer. Use the sample table on this page, then the world clock for the current time.",
      },
      {
        question: "Is Los Angeles three hours behind New York all year?",
        answer:
          "On the January, March, and July sample dates used here, yes, because both zones change clocks on the same US morning. The gap with Honolulu changes: two hours in January and three hours in July, because Hawaii does not observe daylight saving.",
      },
    ],
  },
  {
    slug: "dubai",
    name: "Dubai",
    regionLabel: "Dubai, United Arab Emirates",
    zone: "Asia/Dubai",
    notTheSameAs: "This is Dubai, United Arab Emirates, not a city outside Asia/Dubai.",
    explanation:
      "Dubai uses Asia/Dubai at UTC+4 all year and does not observe daylight saving. London does move: on 15 January 2026 a 09:00 Dubai meeting is 05:00 in London, and on 15 July 2026 the same local hour is 06:00 in London because London is on British Summer Time. The Gulf pattern of staying on one offset is why the gap changes only when the other city changes clocks.",
    comparisons: [{ name: "London", zone: "Europe/London", href: "/time/london/" }],
    faqs: [
      {
        question: "Does Dubai observe daylight saving time?",
        answer:
          "No. Asia/Dubai stays at UTC+4 all year. When London starts British Summer Time, the gap between them changes because London moved, not Dubai.",
      },
      {
        question: "How do I see the current time in Dubai?",
        answer:
          "Search Dubai on the world clock. This page only lists offsets for three sample dates so the HTML does not freeze a clock reading that would immediately be wrong.",
      },
    ],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    regionLabel: "Mumbai, India",
    zone: "Asia/Kolkata",
    notTheSameAs: "This is Mumbai, Maharashtra. Delhi uses the same Indian time zone.",
    explanation:
      "Mumbai uses Asia/Kolkata, India Standard Time, at UTC+5:30 all year. India does not observe daylight saving, so the half hour never disappears. Delhi uses this same zone; a separate Delhi page would repeat these rules. A 09:00 Mumbai meeting is 03:30 in London on 15 January 2026 and 04:30 in London on 15 July 2026, because only London moves for British Summer Time.",
    comparisons: [{ name: "London", zone: "Europe/London", href: "/time/london/" }],
    faqs: [
      {
        question: "Does Mumbai observe daylight saving time?",
        answer:
          "No. India stays on India Standard Time, UTC+5:30, all year. There is no seasonal clock change in Mumbai or Delhi.",
      },
      {
        question: "Why is Mumbai not a whole number of hours from UTC?",
        answer:
          "Asia/Kolkata is defined as five hours and thirty minutes ahead of UTC. The world clock uses that IANA zone rather than rounding to UTC+5 or UTC+6.",
      },
    ],
  },
  {
    slug: "tokyo",
    name: "Tokyo",
    regionLabel: "Tokyo, Japan",
    zone: "Asia/Tokyo",
    notTheSameAs: "This is Tokyo, Japan, in Asia/Tokyo, not a city outside Japan Standard Time.",
    explanation:
      "Tokyo uses Asia/Tokyo, Japan Standard Time, at UTC+9 all year and does not observe daylight saving. The gap with New York is 14 hours on 15 January 2026 and 13 hours on 15 July 2026, because only New York moves. A 09:00 Tokyo morning is 19:00 on 14 January 2026 in New York, and 20:00 on 14 July 2026 in New York. The time difference page also walks through a New York evening that is already the next calendar date in Tokyo.",
    comparisons: [{ name: "New York", zone: "America/New_York", href: "/time/new-york/" }],
    faqs: [
      {
        question: "Does Tokyo observe daylight saving time?",
        answer:
          "No. Japan stays on Japan Standard Time, UTC+9, all year. South Korea and China do not switch clocks either, but they are different zones. China uses a single UTC+8 zone.",
      },
      {
        question: "Can it be tomorrow in Tokyo when it is still today in New York?",
        answer:
          "Yes. Tokyo is many hours ahead of New York, so the calendar date changes there first. On 15 January 2026, 22:00 in New York is already 12:00 on 16 January 2026 in Tokyo.",
      },
    ],
  },
  {
    slug: "sydney",
    name: "Sydney",
    regionLabel: "Sydney, Australia",
    zone: "Australia/Sydney",
    notTheSameAs: "This is Sydney, New South Wales, not Sydney, Nova Scotia.",
    title: "Sydney Time Zone: AEST or AEDT?",
    heading: "Sydney time zone: AEST or AEDT?",
    currentTimeNote:
      "For the current time, search Sydney on the world clock. That clock uses your device's time and Australia/Sydney, so today shows AEST or AEDT. The dates below are examples, not the live minute.",
    explanation:
      "Sydney's time zone is Australia/Sydney. In the southern winter the IANA abbreviation is AEST, Australian Eastern Standard Time, at UTC+10, as on 15 July 2026. In the southern summer it is AEDT, Australian Eastern Daylight Time, at UTC+11, as on 15 January 2026. Brisbane, Queensland, uses Australia/Brisbane and does not observe daylight saving. Sydney is one hour ahead of Brisbane on the January date and level with Brisbane on the July date. Sydney, Nova Scotia, is in Canada and is not this zone.",
    comparisons: [
      { name: "Brisbane", zone: "Australia/Brisbane" },
      { name: "New York", zone: "America/New_York", href: "/time/new-york/" },
    ],
    faqs: [
      {
        question: "Is Sydney AEST or AEDT?",
        answer:
          "Both, in different seasons. Australia/Sydney uses AEST, UTC+10, in the southern winter, and AEDT, UTC+11, in the southern summer. On 15 July 2026 the offset is UTC+10. On 15 January 2026 it is UTC+11.",
      },
      {
        question: "What is Sydney's UTC offset in summer and winter?",
        answer:
          "At 12:00 UTC on 15 January 2026, Australia/Sydney is UTC+11. At 12:00 UTC on 15 July 2026, it is UTC+10. January is daylight saving there. July is standard time.",
      },
      {
        question: "Does Sydney observe daylight saving time?",
        answer:
          "Yes. New South Wales, where Sydney is, moves clocks for its summer. Queensland, including Brisbane, does not. The table compares Australia/Sydney with Australia/Brisbane on the sample dates.",
      },
      {
        question: "Is Sydney two hours ahead of Brisbane in summer?",
        answer:
          "No. The difference is one hour while Sydney is on daylight saving, and zero hours when both are on standard time. The comparison lines on this page are calculated from those zones.",
      },
    ],
  },
];

export function placeBySlug(slug: string): Place | undefined {
  return places.find((place) => place.slug === slug);
}

export function placeTitle(place: Place): string {
  return place.title ?? `Time in ${place.regionLabel}`;
}

export function placeHeading(place: Place): string {
  return place.heading ?? `Time in ${place.regionLabel}`;
}

export function placeDescription(place: Place): string {
  const january = offsetLabel(place.zone, SAMPLE_DATES[0].ms);
  const july = offsetLabel(place.zone, SAMPLE_DATES[2].ms);
  if (place.slug === "sydney") {
    return `Sydney's time zone is Australia/Sydney: ${january} AEDT on 15 January 2026 and ${july} AEST on 15 July 2026. This is Sydney, New South Wales, not Sydney, Nova Scotia.`;
  }
  return `${place.regionLabel} uses ${place.zone}. On 15 January 2026 the offset is ${january}. On 15 July 2026 it is ${july}. ${place.notTheSameAs}`;
}

export function placePath(place: Place): string {
  return `/time/${place.slug}/`;
}
