import type { DeviceClass } from "./types";

interface UADataLike {
  mobile?: boolean;
}

/**
 * Coarse device class (desktop/mobile/tablet only, no fingerprinting).
 * Tablet checks the UA string first: UA-CH has no tablet signal.
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
