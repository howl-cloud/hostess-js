import type { Utm } from "./types";

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

// Matches the ingest's per-value cap; over-length values are truncated rather
// than dropped so a long campaign name still attributes.
const MAX_VALUE_LENGTH = 64;

/**
 * Extract the five `utm_*` parameters from a query string. Every other query
 * parameter is ignored and never sent — this is the only place a raw query
 * value crosses into a beacon.
 */
export function extractUtm(search?: string): Utm {
  const qs = search ?? (typeof location !== "undefined" ? location.search : "");
  const utm: Utm = {};
  if (!qs) return utm;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(qs);
  } catch {
    return utm;
  }

  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`);
    if (value != null && value !== "") {
      utm[key] = value.slice(0, MAX_VALUE_LENGTH);
    }
  }
  return utm;
}
