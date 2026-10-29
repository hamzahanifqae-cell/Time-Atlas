export const HOME_TITLE = "World Clock & Time Zone Converter";

export const HOME_DESCRIPTION =
  "Free world clock and time zone converter. Check the current time in any city, compare the time difference, and explore a live time zone map.";

export const homeFaqs = [
  {
    question: "How do I check the current time in another city?",
    answer:
      "Search the city or country in the world clock. TimeAtlas shows that place's current local time next to your own, including the UTC offset and daylight saving time when that zone is observing it.",
  },
  {
    question: "How do I convert a time zone or see the time difference?",
    answer:
      "Add each city to the comparison. The clocks stay aligned to your device's time, so you can read the time difference between them — for a meeting, a flight, or a deadline — with daylight saving applied where that city uses it.",
  },
  {
    question: "What is the difference between UTC and GMT?",
    answer:
      "UTC (Coordinated Universal Time) is the reference every modern time zone is defined against. GMT (Greenwich Mean Time) is the everyday name for the same zero offset. India at UTC+5:30 is five hours and thirty minutes ahead of UTC. TimeAtlas uses IANA time zone rules, so the offset changes on its own when daylight saving starts or ends.",
  },
  {
    question: "Does this world clock include daylight saving time?",
    answer:
      "Yes. Offsets come from your browser's IANA time zone database, not a fixed number of hours. A city that observes daylight saving time shows the seasonal offset for the current date. Zones that do not observe it, including most of Asia and Africa, stay on standard time.",
  },
  {
    question: "What does the time zone map show?",
    answer:
      "The globe is a time zone map with approximate day and night shading, so you can see where it is currently light or dark. It is a guide, not a precise sunrise and sunset calculator. If WebGL is unavailable, the same clocks and search work on a flat map.",
  },
] as const;

export const cityGroups = [
  {
    region: "Americas",
    places: "New York, Los Angeles, Chicago, Toronto, Mexico City, and São Paulo",
  },
  {
    region: "Europe and Africa",
    places: "London, Paris, Berlin, Madrid, Istanbul, and Johannesburg",
  },
  {
    region: "Middle East and South Asia",
    places: "Dubai, Riyadh, Mumbai, Delhi, Karachi, and Dhaka",
  },
  {
    region: "Asia-Pacific",
    places: "Singapore, Hong Kong, Tokyo, Seoul, Bangkok, Manila, Jakarta, and Sydney",
  },
] as const;
