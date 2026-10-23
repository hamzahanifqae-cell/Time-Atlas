import type { APIRoute } from "astro";
import { siteConfig } from "../config/site";

export const GET: APIRoute = () => {
  const pubId = siteConfig.adsenseClientId?.replace(/^ca-/, "");
  const lines = pubId ? [`google.com, ${pubId}, DIRECT, f08c47fec0942fa0`] : [];

  return new Response(lines.join("\n") + (lines.length ? "\n" : ""), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
