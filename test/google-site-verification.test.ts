import { describe, expect, it } from "vitest";
import { buildSiteConfig } from "../src/config/fromEnv";
import { readGoogleSiteVerification } from "../src/lib/seo/googleSiteVerification";

describe("readGoogleSiteVerification", () => {
  it("treats an empty value as not configured", () => {
    expect(readGoogleSiteVerification(undefined)).toBeUndefined();
    expect(readGoogleSiteVerification("")).toBeUndefined();
    expect(readGoogleSiteVerification("   ")).toBeUndefined();
  });

  it("accepts a bare Search Console token", () => {
    expect(readGoogleSiteVerification("abcDEF1234_token-ok")).toBe("abcDEF1234_token-ok");
  });

  it("extracts the content value from the HTML tag Google displays", () => {
    const tag =
      '<meta name="google-site-verification" content="abcDEF1234_token-ok" />';
    expect(readGoogleSiteVerification(tag)).toBe("abcDEF1234_token-ok");
  });

  it("rejects a non-empty value that is not a token", () => {
    expect(() => readGoogleSiteVerification("paste the token here")).toThrow(
      /PUBLIC_GOOGLE_SITE_VERIFICATION/,
    );
  });
});

describe("buildSiteConfig google site verification", () => {
  it("stores a valid token and ignores an unset one", () => {
    const withToken = buildSiteConfig(
      { PUBLIC_GOOGLE_SITE_VERIFICATION: "abcDEF1234_token-ok" },
      { isLocalBuild: true },
    );
    expect(withToken.googleSiteVerification).toBe("abcDEF1234_token-ok");

    const without = buildSiteConfig({}, { isLocalBuild: true });
    expect(without.googleSiteVerification).toBeUndefined();
  });
});
