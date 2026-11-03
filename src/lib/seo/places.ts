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
      "London uses Europe/London. Winter is Greenwich Mean Time, the zero offset from UTC. Summer is British Summer Time, one hour ahead. The United States starts and ends daylight saving on different weekends, so the London–New York gap is not the same number of hours in every week of March and October. London, Ontario is a different city and uses America/Toronto.",
    comparisons: [{ name: "New York", zone: "America/New_York", href: "/time/new-york/" }],
    faqs: [
      {
        question: "Does London observe daylight saving time?",
        answer:
          "Yes. Europe/London is on Greenwich Mean Time in winter and British Summer Time in summer. The table on this page lists the offset at noon UTC on three dates in 2026. It is not a live clock.",
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
      "New York City uses America/New_York. That is Eastern Time: a larger gap behind UTC in winter, and one hour less behind during daylight saving. Tokyo does not change clocks, so the New York–Tokyo gap itself changes when the US starts or ends daylight saving. In the evening in New York it is often already the next calendar date in Tokyo. York, England, shares Europe/London with London, not America/New_York.",
    comparisons: [
      { name: "London", zone: "Europe/London", href: "/time/london/" },
      { name: "Tokyo", zone: "Asia/Tokyo", href: "/time/tokyo/" },
    ],
    faqs: [
      {
        question: "Does New York observe daylight saving time?",
        answer:
          "Yes. America/New_York uses Eastern Standard Time in winter and Eastern Daylight Time in summer. Hawaii and most of Arizona do not follow that change. The table lists sample dates, not the current minute.",
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
    notTheSameAs: "This is Los Angeles, California, not other cities with similar names.",
    explanation:
      "Los Angeles uses America/Los_Angeles, Pacific Time. New York uses Eastern Time. On ordinary dates the two stay three hours apart, because the US zones that still observe daylight saving change on the same morning. Honolulu does not observe daylight saving, so the Los Angeles–Honolulu gap is wider in summer than in winter. The comparison lines below are calculated for the sample dates.",
    comparisons: [
      { name: "New York", zone: "America/New_York", href: "/time/new-york/" },
      { name: "Honolulu", zone: "Pacific/Honolulu" },
    ],
    faqs: [
      {
        question: "What time zone is Los Angeles in?",
        answer:
          "Los Angeles uses the IANA zone America/Los_Angeles, Pacific Time. The offset is not the same all year. Use the sample table on this page, then the world clock for the current time.",
      },
      {
        question: "Is Los Angeles three hours behind New York all year?",
        answer:
          "On the January, March, and July sample dates used here, yes, because both zones change clocks on the same US morning. The gap with Honolulu changes, because Hawaii does not observe daylight saving.",
      },
    ],
  },
  {
    slug: "dubai",
    name: "Dubai",
    regionLabel: "Dubai, United Arab Emirates",
    zone: "Asia/Dubai",
    notTheSameAs: "This is Dubai in the United Arab Emirates.",
    explanation:
      "Dubai uses Asia/Dubai and does not observe daylight saving. The offset stays put while London moves an hour forward in summer, so a London–Dubai meeting is a different gap in January than in July. Gulf states follow the same pattern of not switching clocks. The lines below are the calculated gaps on the sample dates.",
    comparisons: [{ name: "London", zone: "Europe/London", href: "/time/london/" }],
    faqs: [
      {
        question: "Does Dubai observe daylight saving time?",
        answer:
          "No. Asia/Dubai keeps the same UTC offset all year. When London starts British Summer Time, the gap between them changes because London moved, not Dubai.",
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
      "Mumbai uses Asia/Kolkata, India Standard Time, which is five and a half hours ahead of UTC all year. India does not observe daylight saving, so the half hour never disappears. Delhi uses this same zone; a separate Delhi page would repeat these rules. The gap with London still changes in summer, because London observes daylight saving and India does not.",
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
    notTheSameAs: "This is Tokyo, Japan, not other cities that share a name.",
    explanation:
      "Tokyo uses Asia/Tokyo and does not observe daylight saving. Japan Standard Time stays nine hours ahead of UTC. The gap with New York is wider while New York is on standard time and narrower during US daylight saving, because only New York moves. An evening hour in New York is often already the next calendar date in Tokyo. The time difference page walks through one dated example.",
    comparisons: [{ name: "New York", zone: "America/New_York", href: "/time/new-york/" }],
    faqs: [
      {
        question: "Does Tokyo observe daylight saving time?",
        answer:
          "No. Japan stays on Japan Standard Time all year. South Korea and China do not switch clocks either, but they are different zones and are not the same offset as Tokyo in every case. China uses a single UTC+8 zone.",
      },
      {
        question: "Can it be tomorrow in Tokyo when it is still today in New York?",
        answer:
          "Yes. Tokyo is many hours ahead of New York, so the calendar date changes there first. The time difference page shows a specific evening in January 2026 rather than a live clock.",
      },
    ],
  },
  {
    slug: "sydney",
    name: "Sydney",
    regionLabel: "Sydney, Australia",
    zone: "Australia/Sydney",
    notTheSameAs: "This is Sydney, New South Wales, not Sydney, Nova Scotia.",
    explanation:
      "Sydney uses Australia/Sydney. Daylight saving here is a southern-hemisphere summer, so the January sample is the larger offset and the July sample is standard time. Brisbane, Queensland, uses Australia/Brisbane and does not observe daylight saving. In southern summer Sydney is one hour ahead of Brisbane. In the southern winter the two match. Sydney, Nova Scotia, is in Canada and is not this zone.",
    comparisons: [{ name: "Brisbane", zone: "Australia/Brisbane" }],
    faqs: [
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
  return `Time in ${place.regionLabel}`;
}

export function placeDescription(place: Place): string {
  const january = offsetLabel(place.zone, SAMPLE_DATES[0].ms);
  const july = offsetLabel(place.zone, SAMPLE_DATES[2].ms);
  return `${place.regionLabel} uses ${place.zone}. On 15 January 2026 the offset is ${january}. On 15 July 2026 it is ${july}. ${place.notTheSameAs}`;
}

export function placePath(place: Place): string {
  return `/time/${place.slug}/`;
}
