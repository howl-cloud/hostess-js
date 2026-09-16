export function hasDom(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function isHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/** typeof-guard keeps this safe without process. */
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
