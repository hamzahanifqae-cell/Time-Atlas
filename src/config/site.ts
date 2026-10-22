import { buildSiteConfig } from "./fromEnv";
export { assertReleaseReady, getReleaseIssues } from "./site-node";

/**
 * Centralized, typed site configuration. Values come from environment variables so the same
 * codebase can build for local dev, staging, and production without code changes — see
 * .env.example for the full list and /DEPLOYMENT.md for how each is used.
 */
export const siteConfig = buildSiteConfig(import.meta.env, {
  isLocalBuild: import.meta.env.PUBLIC_ALLOW_LOCAL_BUILD === "true" || import.meta.env.DEV === true,
});

/** The origin to use for canonical URLs, sitemap, and structured data. Falls back to a
 *  relative-safe placeholder in local/dev builds where no real domain is configured yet. */
export const siteOrigin = siteConfig.productionOrigin ?? "http://localhost:4321";
