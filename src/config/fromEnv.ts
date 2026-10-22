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
  };
  return SiteConfigSchema.parse(raw);
}
