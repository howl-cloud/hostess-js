import type { DeviceClass } from "./types";

interface UADataLike {
  mobile?: boolean;
}

/**
 * Coarse device class from UA Client Hints with a UA-string fallback. Only
 * three buckets — no model, no fingerprinting.
 *
 * Tablet is decided from the UA string first because UA-CH low-entropy hints
 * have no tablet signal (an iPad reports `mobile: false`, indistinguishable
 * from a desktop). Everything else prefers the `mobile` hint, falling back to
 * UA-string keywords.
 */
export function deviceClass(): DeviceClass {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  const ua = nav?.userAgent ?? "";

  if (
    /\bipad\b/i.test(ua) ||
    /\btablet\b/i.test(ua) ||
    (/android/i.test(ua) && !/mobile/i.test(ua))
  ) {
    return "tablet";
  }

  const uaData = (nav as { userAgentData?: UADataLike } | undefined)?.userAgentData;
  if (uaData && typeof uaData.mobile === "boolean") {
    return uaData.mobile ? "mobile" : "desktop";
  }

  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}
