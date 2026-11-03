/**
 * Sitemap URLs should be the canonical, indexable HTML pages.
 * A 404, ads.txt, and robots.txt are successful responses but not pages to index.
 */
const EXCLUDED_PATHS = new Set(["/404", "/404.html", "/ads.txt", "/robots.txt"]);

export function isIndexableSitemapUrl(page: string): boolean {
  let pathname: string;
  try {
    pathname = new URL(page, "https://time-atlas.online").pathname;
  } catch {
    return false;
  }
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return !EXCLUDED_PATHS.has(normalized);
}
