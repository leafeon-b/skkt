const DEFAULT_CALLBACK = "/home";

export function sanitizeCallbackUrl(url: string | undefined): string {
  if (!url) return DEFAULT_CALLBACK;
  // Strip control characters and backslashes that URL parsers may interpret differently.
  // Without this, "/\n/evil.com" bypasses startsWith checks, and "/\evil.com" can be
  // treated as a protocol-relative URL by some user agents.
  const cleaned = url.replace(/[\t\n\r\\]/g, "");
  if (cleaned.startsWith("/") && !cleaned.startsWith("//") && !cleaned.includes("/..")) return cleaned;

  // Handle full URLs: extract path from same-origin URLs (e.g. NextAuth result.url)
  try {
    const parsed = new URL(cleaned);
    if (
      typeof window !== "undefined" &&
      parsed.origin === window.location.origin
    ) {
      const path = parsed.pathname + parsed.search + parsed.hash;
      // Re-apply validation on extracted path
      if (path.startsWith("/") && !path.startsWith("//") && !path.includes("/..")) return path;
    }
  } catch {
    // Invalid URL — fall through to default
  }

  return DEFAULT_CALLBACK;
}
