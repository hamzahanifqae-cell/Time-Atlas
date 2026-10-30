import { readGoogleAnalyticsId } from "../lib/seo/googleAnalytics.ts";
import { readGoogleSiteVerification } from "../lib/seo/googleSiteVerification.ts";
import { SiteConfigSchema, type SiteConfig } from "./schema.ts";

/** Minimal shape both import.meta.env (Vite/Astro) and process.env (Node scripts) satisfy. */
export type EnvLike = Record<string, string | boolean | undefined>;

/**
 * Builds a SiteConfig from raw environment variables. This is the one place the env var
 * names are spelled out, so astro.config.mjs, src/config/site.ts, and
 * scripts/release-check.mjs all read configuration exactly the same way.
 */
export function buildSiteConfig(env: EnvLike, opts: { isLocalBuild?: boolean } = {}): SiteConfig {
  const raw = {
    siteName: "TimeAtlas" as const,
    tagline: "Explore the world. Find your time.",
    productionOrigin: (env.PUBLIC_SITE_ORIGIN as string) || undefined,
    operatorName: (env.PUBLIC_OPERATOR_NAME as string) || undefined,
    contactEmail: (env.PUBLIC_CONTACT_EMAIL as string) || undefined,
    staging: env.PUBLIC_STAGING === "true",
    isLocalBuild: Boolean(opts.isLocalBuild ?? (env.PUBLIC_ALLOW_LOCAL_BUILD === "true")),
    adsenseClientId: (env.PUBLIC_ADSENSE_CLIENT_ID as string) || undefined,
    googleSiteVerification: readGoogleSiteVerification(
      env.PUBLIC_GOOGLE_SITE_VERIFICATION as string | undefined,
    ),
    googleAnalyticsId: readGoogleAnalyticsId(env.PUBLIC_GA_MEASUREMENT_ID as string | undefined),
  };
  return SiteConfigSchema.parse(raw);
}
