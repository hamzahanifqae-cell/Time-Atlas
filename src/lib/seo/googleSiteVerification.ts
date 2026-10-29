const TOKEN = /^[A-Za-z0-9+/_=-]{8,200}$/;

/**
 * Reads the Google Search Console HTML-tag token from PUBLIC_GOOGLE_SITE_VERIFICATION.
 * Accepts the content value alone, or the full meta tag Google shows in Search Console.
 * Empty means "not configured". A non-empty value that is not a token fails the build
 * so a pasted tag with quotes or angle brackets cannot ship unnoticed.
 */
export function readGoogleSiteVerification(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  const fromAttribute = trimmed.match(/content\s*=\s*["']([^"']+)["']/i);
  const candidate = (fromAttribute?.[1] ?? trimmed).trim();
  if (!TOKEN.test(candidate)) {
    throw new Error(
      "PUBLIC_GOOGLE_SITE_VERIFICATION is set but is not a valid Google Search Console token. Paste only the content value from the HTML tag method (letters, numbers, and - _ + / =).",
    );
  }
  return candidate;
}
