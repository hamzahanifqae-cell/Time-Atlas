#!/usr/bin/env node
/**
 * Standalone release-readiness check: validates the real .env configuration without doing a
 * full build. Run via `npm run release:check`. Exits non-zero (and prints every problem) if
 * configuration is missing or invalid for a public, non-staging launch.
 *
 * This uses the exact same validation (src/config/schema.ts) as astro.config.mjs, so passing
 * here means a standard `npm run build` will also pass.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSiteConfig } from "../src/config/fromEnv.ts";
import { getReleaseIssues } from "../src/config/site-node.ts";

const ROOT = path.dirname(fileURLToPath(new URL("..", import.meta.url)));

for (const file of [".env", ".env.production", ".env.local"]) {
  try {
    process.loadEnvFile(path.join(ROOT, file));
  } catch {
    // Missing files are fine — .env.example documents what's expected.
  }
}

const config = buildSiteConfig(process.env, { isLocalBuild: false });
const issues = getReleaseIssues(config);

if (config.staging) {
  console.log("Note: PUBLIC_STAGING=true — this build will ship noindex metadata.");
}

if (issues.length === 0) {
  console.log("Release check passed: configuration is valid for a public launch.");
  console.log(`  Origin:   ${config.productionOrigin}`);
  console.log(`  Operator: ${config.operatorName}`);
  console.log(`  Contact:  ${config.contactEmail}`);
  console.log(
    "\nThis confirms the configuration is well-formed. It does NOT confirm domain ownership,\n" +
      "DNS resolution, HTTPS availability, or that the contact email can receive mail.",
  );
  process.exit(0);
} else {
  console.error("Release check FAILED:\n");
  for (const issue of issues) {
    console.error(`  - [${issue.field}] ${issue.message}`);
  }
  console.error("\nSee .env.example for the required variables.");
  process.exit(1);
}
