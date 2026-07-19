/** True only in a real browser (guards against SSR / Node import). */
export function hasDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/** True at the moment the page is hidden — the correctness-critical flush point. */
export function isHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/**
 * `NODE_ENV=development` disables all beacons (bundlers inline this constant;
 * the `typeof` guard keeps it safe when `process` is absent in the browser).
 */
export function isDevelopment(): boolean {
  try {
    return (
      typeof process !== "undefined" &&
      !!process.env &&
      process.env.NODE_ENV === "development"
    );
  } catch {
    return false;
  }
}
