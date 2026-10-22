import { validateReleaseReadiness, type SiteConfig, type ConfigIssue } from "./schema.ts";

export type { ConfigIssue };

/** Node-safe variant of the release-readiness check (no `import.meta.env` dependency), used
 *  by astro.config.mjs and scripts/release-check.mjs. Throws with a readable message. */
export function assertReleaseReady(config: SiteConfig): void {
  const issues = validateReleaseReadiness(config);
  if (issues.length > 0) {
    const lines = issues.map((i) => `  - ${i.message}`).join("\n");
    throw new Error(
      `TimeAtlas production build is missing required configuration:\n${lines}\n\n` +
        `Set these in .env (see .env.example), or run "npm run build:local" for a local-only build.`,
    );
  }
}

export function getReleaseIssues(config: SiteConfig): ConfigIssue[] {
  return validateReleaseReadiness(config);
}
