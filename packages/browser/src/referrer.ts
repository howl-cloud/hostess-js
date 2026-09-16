/** Origin-only referrer; "" for direct, same-origin, and non-http(s). Never leaks path. */
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
