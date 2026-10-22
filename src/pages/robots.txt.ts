import type { APIRoute } from "astro";
import { siteConfig, siteOrigin } from "../config/site";

export const GET: APIRoute = () => {
  const lines = siteConfig.staging
    ? ["User-agent: *", "Disallow: /"]
    : ["User-agent: *", "Allow: /", "", `Sitemap: ${siteOrigin}/sitemap-index.xml`];

  return new Response(lines.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
