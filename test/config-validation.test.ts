import { describe, it, expect } from "vitest";
import {
  validateProductionOrigin,
  validateContactEmail,
  validateReleaseReadiness,
  type SiteConfig,
} from "../src/config/schema";

describe("validateProductionOrigin", () => {
  it("accepts a well-formed https origin", () => {
    expect(validateProductionOrigin("https://timeatlas-fixture.dev").ok).toBe(true);
  });

  it("rejects http (non-TLS)", () => {
    const r = validateProductionOrigin("http://timeatlas-fixture.dev");
    expect(r.ok).toBe(false);
  });

  it("rejects localhost", () => {
    expect(validateProductionOrigin("https://localhost").ok).toBe(false);
    expect(validateProductionOrigin("https://localhost:4321").ok).toBe(false);
  });

  it("rejects IP literals (v4 and v6)", () => {
    expect(validateProductionOrigin("https://192.168.1.1").ok).toBe(false);
    expect(validateProductionOrigin("https://[::1]").ok).toBe(false);
  });

  it("rejects reserved example/test/invalid domains and their subdomains", () => {
    expect(validateProductionOrigin("https://example.com").ok).toBe(false);
    expect(validateProductionOrigin("https://staging.example.com").ok).toBe(false);
    expect(validateProductionOrigin("https://timeatlas.example").ok).toBe(false);
    expect(validateProductionOrigin("https://foo.test").ok).toBe(false);
    expect(validateProductionOrigin("https://foo.invalid").ok).toBe(false);
  });

  it("rejects embedded credentials", () => {
    expect(validateProductionOrigin("https://user:pass@timeatlas-fixture.dev").ok).toBe(false);
  });

  it("rejects a query string, fragment, or path", () => {
    expect(validateProductionOrigin("https://timeatlas-fixture.dev/?x=1").ok).toBe(false);
    expect(validateProductionOrigin("https://timeatlas-fixture.dev/#x").ok).toBe(false);
    expect(validateProductionOrigin("https://timeatlas-fixture.dev/app").ok).toBe(false);
  });

  it("rejects a bare, non-fully-qualified hostname", () => {
    expect(validateProductionOrigin("https://timeatlas").ok).toBe(false);
  });

  it("rejects malformed URLs", () => {
    expect(validateProductionOrigin("not a url").ok).toBe(false);
  });

  it("normalizes through the URL parser (trailing dot, case)", () => {
    const r = validateProductionOrigin("HTTPS://TimeAtlas-Fixture.dev");
    expect(r.ok).toBe(true);
  });
});

describe("validateContactEmail", () => {
  it("accepts a plausible email", () => {
    expect(validateContactEmail("hello@timeatlas-fixture.dev").ok).toBe(true);
  });

  it("rejects malformed email syntax", () => {
    expect(validateContactEmail("not-an-email").ok).toBe(false);
    expect(validateContactEmail("missing-domain@").ok).toBe(false);
    expect(validateContactEmail("@no-local-part.com").ok).toBe(false);
  });

  it("rejects reserved example/test domains", () => {
    expect(validateContactEmail("hello@example.com").ok).toBe(false);
    expect(validateContactEmail("hello@sub.example.com").ok).toBe(false);
  });
});

describe("validateReleaseReadiness", () => {
  const base: SiteConfig = {
    siteName: "TimeAtlas",
    tagline: "Explore the world. Find your time.",
    staging: false,
    isLocalBuild: false,
  };

  it("passes local builds regardless of missing fields", () => {
    expect(validateReleaseReadiness({ ...base, isLocalBuild: true })).toEqual([]);
  });

  it("fails a non-local build with nothing configured", () => {
    const issues = validateReleaseReadiness(base);
    expect(issues.length).toBe(3);
  });

  it("passes a non-local build with full valid fixture configuration", () => {
    const issues = validateReleaseReadiness({
      ...base,
      productionOrigin: "https://timeatlas-fixture.dev",
      operatorName: "Fixture Operator",
      contactEmail: "hello@timeatlas-fixture.dev",
    });
    expect(issues).toEqual([]);
  });

  it("fails when origin is malformed even if other fields are set", () => {
    const issues = validateReleaseReadiness({
      ...base,
      productionOrigin: "https://example.com",
      operatorName: "Fixture Operator",
      contactEmail: "hello@timeatlas-fixture.dev",
    });
    expect(issues.length).toBe(1);
    expect(issues[0].field).toBe("productionOrigin");
  });
});
