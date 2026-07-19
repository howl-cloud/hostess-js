import type { Beacon } from "./types";
import { isDevelopment } from "./env";
import { getQueue } from "./state";

/**
 * The single gate every beacon passes through.
 *
 * - `debug` logs the would-be payload (works even in development, so you can
 *   verify what *would* be sent).
 * - `NODE_ENV=development` is silent: it returns before the queue is ever
 *   created, guaranteeing no network and no listeners in development.
 */
export function report(beacon: Beacon, debug: boolean): void {
  if (debug) {
    try {
      console.log("[hostess/browser]", beacon);
    } catch {
      // console unavailable — never let logging break the host page.
    }
  }
  if (isDevelopment()) return;
  getQueue().push(beacon);
}
