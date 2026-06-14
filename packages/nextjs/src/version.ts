// Bumped in lockstep with package.json on release.
export const SDK_VERSION = "0.1.0";

/**
 * The running Next.js version, read from `next/package.json` at startup — the
 * authoritative framework-version signal. Best-effort: falls back to "unknown"
 * (the platform's build-artifact extraction is the secondary source).
 */
export function readNextVersion(): string {
  try {
    if (typeof require === "function") {
      const pkg = require("next/package.json") as { version?: string };
      return pkg.version ?? "unknown";
    }
  } catch {
    // next not resolvable from here (e.g. pure-ESM runtime) — fall through.
  }
  return "unknown";
}
