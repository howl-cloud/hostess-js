/** Server-only. */
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
