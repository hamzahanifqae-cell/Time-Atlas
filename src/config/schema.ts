import { z } from "zod";

// RFC 2606 reserved TLDs/domains (.test, .example, .invalid, .localhost, and the
// example.{com,net,org} second-level domains), matched on the hostname itself or any
// subdomain of it (e.g. "staging.example.com" and "foo.timeatlas.test" are both rejected).
const RESERVED_SUFFIXES = [
  "localhost",
  "example.com",
  "example.net",
  "example.org",
  "example",
  "test",
  "invalid",
];

function isReservedDomain(hostname: string): boolean {
  return RESERVED_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
}

function isIpLiteral(hostname: string): boolean {
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  // IPv6 (hostnames from URL parsing come bracket-stripped is not guaranteed, so also catch
  // the bracketed form and bare colon-containing hosts).
  if (hostname.includes(":")) return true;
  return false;
}

/**
 * Validates a production origin URL. Shared by the Astro config loader and the release-check
 * script so both apply exactly the same rules. This checks *shape*, not reachability: it
 * cannot and does not prove the domain is owned, resolves, serves HTTPS, or anything else —
 * see the warnings surfaced alongside each check's result.
 */
export function validateProductionOrigin(value: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "not a valid URL" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "must use https:// (production sites must be served over HTTPS)" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "must not embed credentials in the URL" };
  }
  if (url.search) {
    return { ok: false, reason: "must not include a query string" };
  }
  if (url.hash) {
    return { ok: false, reason: "must not include a fragment" };
  }
  if (url.pathname !== "/" && url.pathname !== "") {
    return { ok: false, reason: "must not include a path — use the bare origin" };
  }

  const hostname = url.hostname.toLowerCase();
  if (isIpLiteral(hostname)) {
    return { ok: false, reason: "must be a domain name, not an IP literal" };
  }
  if (isReservedDomain(hostname)) {
    return {
      ok: false,
      reason: "must not be localhost, an IP literal, or a reserved example/test domain (or a subdomain of one)",
    };
  }
  const labels = hostname.split(".");
  if (labels.length < 2) {
    return { ok: false, reason: "must be a fully-qualified domain (e.g. example.com, not a bare host)" };
  }

  return { ok: true, url };
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactEmail(value: string): { ok: true } | { ok: false; reason: string } {
  if (!emailRegex.test(value)) {
    return { ok: false, reason: "not a syntactically valid email address" };
  }
  const domain = value.split("@")[1]?.toLowerCase() ?? "";
  if (isReservedDomain(domain)) {
    return { ok: false, reason: "must not use a reserved example/test domain (or a subdomain of one)" };
  }
  return { ok: true };
}

export const SiteConfigSchema = z.object({
  siteName: z.literal("TimeAtlas"),
  tagline: z.string().min(1),
  /** Bare HTTPS origin, e.g. "https://timeatlas.example" — required for production builds. */
  productionOrigin: z.string().optional(),
  operatorName: z.string().optional(),
  contactEmail: z.string().optional(),
  /** When true, pages are built with a global noindex directive (for staging deploys). */
  staging: z.boolean(),
  /** Local/dev build: skips the production-origin/operator/email requirement entirely. */
  isLocalBuild: z.boolean(),
  /**
   * Google AdSense publisher ID (e.g. "ca-pub-xxxxxxxxxxxxxxxx"). Optional and unset by
   * default — only present once the operator has deliberately opted into AdSense for a given
   * build (e.g. for site-ownership verification). When set, Layout.astro includes Google's
   * Auto Ads script on every page, which can begin serving ads automatically once the site is
   * approved. This does not imply a consent-management flow or an updated privacy disclosure
   * exists — those are the operator's responsibility to add before ads should actually serve
   * to EEA/UK visitors under Google's own policies.
   */
  adsenseClientId: z.string().optional(),
  /**
   * Google Search Console HTML-tag verification token. Public by design: it is rendered as
   * <meta name="google-site-verification">. Optional. Empty means the tag is omitted.
   */
  googleSiteVerification: z.string().optional(),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

export interface ConfigIssue {
  field: string;
  message: string;
}

/** Full validation used by the release-check script (and mirrored by astro.config at build
 *  time): for a non-local, non-staging production build, origin/operator/email are required
 *  and must pass shape validation. */
export function validateReleaseReadiness(config: SiteConfig): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  if (config.isLocalBuild) return issues;

  if (!config.productionOrigin) {
    issues.push({ field: "productionOrigin", message: "PUBLIC_SITE_ORIGIN is required for a production build." });
  } else {
    const result = validateProductionOrigin(config.productionOrigin);
    if (!result.ok) {
      issues.push({ field: "productionOrigin", message: `PUBLIC_SITE_ORIGIN ${result.reason}.` });
    }
  }

  if (!config.operatorName || !config.operatorName.trim()) {
    issues.push({ field: "operatorName", message: "PUBLIC_OPERATOR_NAME is required for a production build." });
  }

  if (!config.contactEmail) {
    issues.push({ field: "contactEmail", message: "PUBLIC_CONTACT_EMAIL is required for a production build." });
  } else {
    const result = validateContactEmail(config.contactEmail);
    if (!result.ok) {
      issues.push({ field: "contactEmail", message: `PUBLIC_CONTACT_EMAIL ${result.reason}.` });
    }
  }

  return issues;
}
