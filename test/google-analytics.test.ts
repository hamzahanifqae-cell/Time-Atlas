import { describe, expect, it } from "vitest";
import { buildSiteConfig } from "../src/config/fromEnv";
import { readGoogleAnalyticsId } from "../src/lib/seo/googleAnalytics";

describe("readGoogleAnalyticsId", () => {
  it("treats an empty value as analytics off", () => {
    expect(readGoogleAnalyticsId(undefined)).toBeUndefined();
    expect(readGoogleAnalyticsId("")).toBeUndefined();
  });

  it("accepts a GA4 measurement ID", () => {
    expect(readGoogleAnalyticsId("G-ABC123XYZ")).toBe("G-ABC123XYZ");
  });

  it("rejects a non-empty value that is not a measurement ID", () => {
    expect(() => readGoogleAnalyticsId("UA-12345-1")).toThrow(/PUBLIC_GA_MEASUREMENT_ID/);
  });
});

describe("buildSiteConfig google analytics", () => {
  it("stores a valid measurement ID", () => {
    const config = buildSiteConfig(
      { PUBLIC_GA_MEASUREMENT_ID: "G-ABC123XYZ" },
      { isLocalBuild: true },
    );
    expect(config.googleAnalyticsId).toBe("G-ABC123XYZ");
  });
});
