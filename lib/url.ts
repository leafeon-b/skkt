const DEFAULT_CALLBACK = "/home";

/** Fully decode a URI string, handling double-encoding. Returns null on malformed input. */
function fullyDecode(value: string): string | null {
  const MAX_ITERATIONS = 10;
  try {
    let decoded = decodeURIComponent(value);
    // Handle double-encoded sequences (e.g. %252f -> %2f -> /)
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return decoded;
      decoded = next;
    }
    return null;
  } catch {
    return null;
  }
}

function hasPathTraversal(value: string): boolean {
  return value.includes("/..");
}

export function sanitizeCallbackUrl(url: string | undefined): string {
  if (!url) return DEFAULT_CALLBACK;
  // Strip control characters and backslashes that URL parsers may interpret differently.
  // Without this, "/\n/evil.com" bypasses startsWith checks, and "/\evil.com" can be
  // treated as a protocol-relative URL by some user agents.
  const cleaned = url.replace(/[\t\n\r\\]/g, "");
  if (cleaned.startsWith("/") && !cleaned.startsWith("//") && !hasPathTraversal(cleaned)) {
    const decoded = fullyDecode(cleaned);
    if (decoded === null || hasPathTraversal(decoded)) return DEFAULT_CALLBACK;
    return cleaned;
  }

  // Handle full URLs: extract path from same-origin URLs (e.g. NextAuth result.url)
  try {
    const parsed = new URL(cleaned);
    if (
      typeof window !== "undefined" &&
      parsed.origin === window.location.origin
    ) {
      const path = parsed.pathname + parsed.search + parsed.hash;
      // Re-apply validation on extracted path
      if (path.startsWith("/") && !path.startsWith("//") && !hasPathTraversal(path)) {
        const decoded = fullyDecode(path);
        if (decoded === null || hasPathTraversal(decoded)) return DEFAULT_CALLBACK;
        return path;
      }
    }
  } catch {
    // Invalid URL — fall through to default
  }

  return DEFAULT_CALLBACK;
}

const GOOGLE_FORMS_URL_PATTERN = /^https:\/\/docs\.google\.com\/forms\//;

export function validateContactFormUrl(
  raw: string | undefined,
): string | undefined {
  return raw && GOOGLE_FORMS_URL_PATTERN.test(raw) ? raw : undefined;
}
