const DEFAULT_CALLBACK = "/home";

export function sanitizeCallbackUrl(url: string | undefined): string {
  if (!url) return DEFAULT_CALLBACK;
  // Strip control characters that URL parsers silently remove (tab, newline, CR).
  // Without this, "/\n/evil.com" passes the startsWith checks but resolves to "//evil.com".
  const cleaned = url.replace(/[\t\n\r]/g, "");
  if (cleaned.startsWith("/") && !cleaned.startsWith("//")) return cleaned;

  // Handle full URLs: extract path from same-origin URLs (e.g. NextAuth result.url)
  try {
    const parsed = new URL(cleaned);
    if (
      typeof window !== "undefined" &&
      parsed.origin === window.location.origin
    ) {
      const path = parsed.pathname + parsed.search + parsed.hash;
      // Re-apply validation on extracted path
      if (path.startsWith("/") && !path.startsWith("//")) return path;
    }
  } catch {
    // Invalid URL — fall through to default
  }

  return DEFAULT_CALLBACK;
}
