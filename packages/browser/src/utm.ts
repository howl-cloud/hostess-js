import type { Utm } from "./types";

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

// Truncate (don't drop) over-length values so long campaigns still attribute.
const MAX_VALUE_LENGTH = 64;

/** Extract utm_* params; all other query params are ignored and never sent. */
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
