/**
 * Reduce a referrer URL to its origin only — never the path or query. Returns
 * "" for direct visits, same-origin navigations, and non-http(s) schemes, so a
 * beacon can never leak where on another site the visitor came from.
 */
export function referrerOrigin(ref?: string): string {
  const raw = ref ?? (typeof document !== "undefined" ? document.referrer : "");
  if (!raw) return "";

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return "";

  const here = typeof location !== "undefined" ? location.origin : "";
  if (url.origin === here) return "";

  return url.origin;
}
