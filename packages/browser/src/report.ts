import type { Beacon } from "./types";
import { isDevelopment } from "./env";
import { getQueue } from "./state";

/**
 * Single gate for all beacons. Debug logs the payload; development returns
 * before the queue exists (no network, no listeners).
 */
export function report(beacon: Beacon, debug: boolean): void {
  if (debug) {
    try {
      console.log("[hostess/browser]", beacon);
    } catch {}
  }
  if (isDevelopment()) return;
  getQueue().push(beacon);
}
