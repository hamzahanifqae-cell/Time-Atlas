# TimeAtlas SEO notes

These notes describe the changes in this working tree, what is still open, and how to measure them after deploy. They do not promise rankings. Google chooses what to show.

The site is a static Astro world clock. Clocks run in the browser from the device clock and IANA time zones. Search, saved cities, and Time explorer do not create public URLs.

## What changed

- Each indexable page keeps its own title, description, canonical URL, and H1. Canonicals use `https://time-atlas.online/` plus the page path. City pages are not canonicalized to the homepage.
- `public/.htaccess` now sends `http://` and `www` to `https://time-atlas.online` with a 301, and sends `/sitemap.xml` to `/sitemap-index.xml` with a 301. Redirects are a strong canonical signal. `rel="canonical"` remains on every HTML page. This file is specific to this production host. Do not copy the host rules onto a staging server.
- The sitemap lists the canonical HTML pages only. It omits `/404/`, `ads.txt`, and `robots.txt`. It does not include `lastmod`. Google uses `lastmod` only when it is accurate. A build timestamp would claim every page changed on every deploy. Google ignores `changefreq` and `priority`.
- `robots.txt` still allows crawling and points at `https://time-atlas.online/sitemap-index.xml`. The 404 page uses `noindex`. Blocking a URL in robots.txt is not how to drop it from the index.
- New pages, only where the answer is different:
  - `/time-difference/` explains Compare cities (up to six, stored in this browser only), Time explorer (the instant is chosen in UTC and is not put in the URL), the March 2026 week when London and New York are 4 hours apart instead of 5, and a dated example of Tokyo already being on the next calendar date.
  - `/time/` and seven city pages: London, New York City, Los Angeles, Dubai, Mumbai, Tokyo, and Sydney. Offsets are calculated for 15 January, 15 March, and 15 July 2026 at 12:00 UTC. Titles and descriptions do not contain a live clock reading. Same-name cities are distinguished (London, Ontario; York, England; Sydney, Nova Scotia).
- No page was generated for every city, and none for city pairs. Delhi is the same zone as Mumbai, so it has no page of its own.
- Visible breadcrumbs and matching `BreadcrumbList` markup were added on the inner pages.
- Guide and daylight-saving markup is `WebPage` plus, where questions are visible, `FAQPage`. Those pages are not news articles, and they have no visible author, date, or image to mark up. The homepage still uses `WebSite`, `WebApplication`, and `FAQPage`. The price of zero matches the visible line "Free to use in the browser." No ratings were invented.
- Open Graph and Twitter card tags already come from the layout (title, description, canonical URL). There is no share image in the repo besides the favicon, so none was invented.
- HTML compression was turned off so spaces between links and the surrounding words stay visible.
- Header and footer link to the time-difference page. The footer and homepage also link to the city pages that exist.

## Page-to-query map

The only Search Console numbers below are the ones already visible in the property around 2 November 2026, for a 7-day window: 2 clicks, 21 impressions, 9.5% CTR, average position 13.4. Queries shown then were mostly the brand ("time atlas", "timeatlas", "atlas time clock") plus one impression for "what countries don't observe daylight saving time". This session did not open Search Console, so those figures were not refreshed. Nothing below is a search volume or a keyword difficulty.

| Page | Primary intent | Query ideas to watch in Search Console | Why this page |
| --- | --- | --- | --- |
| `/` | Use a world clock | world clock, current time, time zone converter | The tool itself. Brand queries already appear here. |
| `/clocks/` | Browse times by country | world clock by country, current local time by city | Same clocks, without the globe. |
| `/time-difference/` | Compare two places for a meeting | time difference between cities, meeting time across time zones | Explains the real comparison tool, date rollover, and daylight-saving gaps. Not a page per city pair. |
| `/time/london/` | Time in London, England | time in London, GMT and BST | `Europe/London`. Not London, Ontario. |
| `/time/new-york/` | Time in New York City | time in New York, Eastern Time | `America/New_York`. Not York, England. |
| `/time/los-angeles/` | Time in Los Angeles | time in Los Angeles, Pacific Time | Gap with New York stays 3 hours on the sample dates. Gap with Honolulu does not. |
| `/time/dubai/` | Time in Dubai | time in Dubai, GST | `Asia/Dubai`, no daylight saving. Gap with London changes because London moves. |
| `/time/mumbai/` | Time in Mumbai | time in Mumbai, IST, UTC+5:30 | `Asia/Kolkata`. Half-hour offset, no daylight saving. Delhi uses the same zone. |
| `/time/tokyo/` | Time in Tokyo | time in Tokyo, JST | `Asia/Tokyo`, no daylight saving. Often the next calendar date relative to New York. |
| `/time/sydney/` | Time in Sydney | time in Sydney, AEST, AEDT | Southern-hemisphere daylight saving. One hour ahead of Brisbane in January, the same in July. |
| `/time/` | Find the city pages above | time in major cities | Hub. Tells people to search the clock for every other city. |
| `/daylight-saving/` | Which places do not change clocks | what countries don't observe daylight saving time | This is the one non-brand query already seen. |
| `/guide/` | Understand zones | UTC vs GMT, what a time zone is | Reference. Not a second copy of the clock. |

Treat every query except the ones listed from Search Console as a hypothesis. Confirm or drop them from the Performance report after the pages have been live for a few weeks.

## What was verified

In this working tree, on 3 November 2026:

- `npm test`: 120 tests passed, including IANA offsets for the sample dates (London/New York 5 hours in January and July, 4 hours on 15 March 2026; Tokyo 14 hours ahead of New York in January and 13 in July; Sydney one hour ahead of Brisbane in January and level in July; Mumbai stays at UTC+5:30).
- `npm run typecheck`: no errors.
- Production-origin build (`PUBLIC_SITE_ORIGIN=https://time-atlas.online`) wrote 16 sitemap URLs. No `lastmod`, no 404, no `ads.txt`, no `robots.txt`. `robots.txt` allows `/` and names the sitemap index.
- Rendered HTML for `/`, `/time-difference/`, and `/time/london/` has the expected title, description, self-canonical, and indexable robots tag. The 404 document is `noindex`. Local preview returned HTTP 200 for those pages and HTTP 404 for an unknown path.
- Browser check of the preview: homepage H1 and "Free to use in the browser"; time-difference examples including "it is 12:00 on 16 January 2026 in Tokyo"; London table (UTC, UTC, UTC+1); breadcrumbs; desktop nav and the mobile menu both include Time Difference. No console errors on those pages.
- Live host, before this deploy: `https://time-atlas.online/`, `http://time-atlas.online/`, `https://www.time-atlas.online/`, and `http://www.time-atlas.online/` all returned HTTP 200 with the same homepage. `https://time-atlas.online/this-page-should-404-seo-check/` returned HTTP 404. Apache is serving HTTPS directly (no proxy header was visible).

## Not verified

- These pages are not deployed. Live indexing was not checked. Search Console was not opened in this session.
- The new 301 rules are not on the server yet. After deploy, request `http://time-atlas.online/` and both `www` hosts once. Each should be a single 301 to `https://time-atlas.online/`. If the homepage redirects forever, the HTTPS rule does not match how this server sees HTTPS. Comment that rule out and redeploy. Do not leave a loop up.
- No Core Web Vitals or PageSpeed score was measured. The production build still warns that a JavaScript chunk is larger than 500 kB. That chunk is the globe. Google Fonts still load from a render-blocking stylesheet. Neither was removed, because the globe and the type are the product.
- Whether `/daylight-saving/` is indexed yet is unknown. Indexing was requested earlier. Do not request it again.
- FAQ and breadcrumb markup do not guarantee rich results. Google's structured-data guidelines say markup only makes a feature eligible, and the content has to be visible. That is why the markup matches the text on the page.

## Manual Search Console steps

Do these after the files are on `https://time-atlas.online/`. Do not do them against the local preview.

1. Confirm the four host variants behave as above, and that `/time/london/` and `/time-difference/` return HTTP 200 on `https://time-atlas.online`.
2. In the existing property `https://time-atlas.online/`, open Sitemaps. The submitted sitemap should stay `https://time-atlas.online/sitemap-index.xml`. Do not add a second sitemap. After Google recrawls it, `sitemap-0.xml` should list the new URLs. Success on a sitemap does not mean every URL is indexed.
3. Use URL Inspection once each for `/time-difference/`, `/time/`, and the seven city URLs. If a URL is unknown, request indexing once. Do not repeat a request that is already queued. Do not resubmit `/daylight-saving/` if it is still in the queue.
4. Leave the homepage as it is if it still says the page is indexed.
5. A week or two later, open the Pages report and note how many of the new URLs are indexed, and whether any are "Duplicate without user-selected canonical" or "Crawled - currently not indexed".

## Measurement plan

Use Search Console Performance and the GA4 property already installed (`G-BT75E2ZEPL`). Compare periods of the same length, starting only after the deploy date. A 7-day window against a 28-day window is not a comparison. Prefer 28 days against the previous 28 days, and look at the same weekdays. March, late October, and the Australian daylight-saving change in April can change which time-zone questions people search. Say so when a spike lines up with those weeks.

Record, for the whole property and for the new pages:

- Organic clicks
- Impressions
- CTR
- Average position
- Indexed page count from the Pages report
- GA4 views and engaged sessions for `/`, `/clocks/`, `/time-difference/`, `/time/`, and `/daylight-saving/`

There is no account, purchase, or form to treat as a conversion. An engaged session that reaches the clock, the time-difference page, or a city page is the closest useful outcome the current setup can show. Do not invent a conversion rate. If a later change adds a search or "add to comparison" event, start that series from the day the event ships and do not splice it onto older page-view numbers.

Brand queries can rise because more people hear the name. That is not the same thing as ranking for "time in London". Read the query list, not just the totals.

## Content and promotion backlog

In order:

1. Deploy, confirm the redirects, then inspect the new URLs once.
2. Add another city page only when its rule is not already on an existing page. Reasonable next pages: Phoenix (`America/Phoenix`, no daylight saving, unlike the rest of Mountain Time) and Honolulu (`Pacific/Honolulu`, no daylight saving). One Central European page, such as Paris, is useful only if it explains `Europe/Paris` versus London, not if it repeats London with the name swapped. Do not add Delhi. Do not add city-pair pages.
3. Make a real share image, then add `og:image`. Do not generate a fake screenshot of a clock.
4. After the new pages have been live long enough for field data, check Core Web Vitals in Search Console before changing the globe or the fonts.
5. Optional, if the measurement plan needs more than page views: a GA4 event when someone searches and when someone adds a city. That is product analytics, not a ranking trick.

Do not buy links, trade links, or submit the site to batches of directories. The useful distribution is ordinary: the daylight-saving page and the time-difference page answer specific questions, and the pages link to each other. Share those URLs where the answer is actually relevant.

## Deploy

These edits are local only. They are not committed and not on the server. After a commit and push to `main`, the cPanel sequence that has worked for this site is:

```
cd ~/Time-Atlas && git pull origin main && source /opt/alt/alt-nodejs22/enable && npm run build:local && cp -a dist/. /home/techshakerco99/public_html/time-atlas.online/
```

Use `build:local` while `PUBLIC_OPERATOR_NAME` and `PUBLIC_CONTACT_EMAIL` are unset. The server `.env` must still contain `PUBLIC_SITE_ORIGIN=https://time-atlas.online` or the sitemap and canonicals will not use the production host.
