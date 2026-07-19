import type { Beacon } from "./types";
import { isHidden } from "./env";

// Same-origin ingest path (howl-cloud/hostess#32). Never cross-origin, so no
// CORS ever applies.
const ENDPOINT = "/_hostess/rum";

// Transport hard caps from schema v1: a request carries at most 20 beacons and
// 8 KB. A flush is split into as many batches as needed to respect both.
const MAX_BEACONS = 20;
const MAX_BYTES = 8 * 1024;

const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

function byteLength(s: string): number {
  return encoder ? encoder.encode(s).length : s.length;
}

/** Greedily pack beacons into batches that respect both the count and byte caps. */
export function splitBatches(beacons: Beacon[]): Beacon[][] {
  const batches: Beacon[][] = [];
  let current: Beacon[] = [];

  for (const beacon of beacons) {
    const candidate = current.length ? [...current, beacon] : [beacon];
    const tooMany = candidate.length > MAX_BEACONS;
    const tooBig = byteLength(JSON.stringify(candidate)) > MAX_BYTES;

    if (current.length && (tooMany || tooBig)) {
      batches.push(current);
      current = [beacon]; // a single beacon over 8 KB is unsplittable; send alone
    } else {
      current = candidate;
    }
  }

  if (current.length) batches.push(current);
  return batches;
}

/**
 * Page-lifetime beacon queue. One instance per page (a window singleton shared
 * by `inject` and `injectSpeedInsights`), so their beacons batch together.
 *
 * Flush triggers: the queue reaches `MAX_BEACONS`, the page transitions to
 * hidden, or a beacon is enqueued while the page is already hidden. That last
 * rule is what makes the CLS/INP path correct without depending on listener
 * order: `web-vitals` finalizes those metrics inside its own
 * `visibilitychange` handler, and whichever order the handlers run, a beacon
 * pushed while hidden flushes immediately.
 *
 * Failure posture (fire-and-forget, back-off-and-stop): a disabled endpoint
 * returns 404, but `navigator.sendBeacon`'s boolean only reports whether the UA
 * queued the request, never the HTTP status. So the queue *probes* with an
 * observable `fetch(keepalive)` until the first success; a 404 or network
 * error there stops the queue for the rest of the page's life (silent and free
 * after the first failure). Once the endpoint is confirmed live, it prefers
 * `sendBeacon` — the only transport that reliably survives page unload.
 */
export class BeaconQueue {
  private buffer: Beacon[] = [];
  private stopped = false;
  private verified = false;
  private listening = false;

  push(beacon: Beacon): void {
    if (this.stopped) return;
    this.ensureListeners();
    this.buffer.push(beacon);
    if (this.buffer.length >= MAX_BEACONS || isHidden()) this.flush();
  }

  flush(): void {
    if (this.stopped || this.buffer.length === 0) return;
    const batches = splitBatches(this.buffer);
    this.buffer = [];
    for (const batch of batches) this.send(batch);
  }

  /** Halt all sending for the page lifetime and drop anything buffered. */
  stop(): void {
    this.stopped = true;
    this.buffer = [];
  }

  private ensureListeners(): void {
    if (this.listening || typeof document === "undefined") return;
    this.listening = true;
    document.addEventListener("visibilitychange", () => {
      if (isHidden()) this.flush();
    });
  }

  private send(batch: Beacon[]): void {
    const body = JSON.stringify(batch);

    // Fast path once the endpoint is confirmed live: sendBeacon survives unload.
    if (this.verified && this.trySendBeacon(body)) return;

    // Observable path: confirms the endpoint and detects a disabled one.
    if (typeof fetch === "function") {
      fetch(ENDPOINT, {
        method: "POST",
        body,
        keepalive: true,
        credentials: "omit",
        // text/plain mirrors sendBeacon and keeps this a simple same-origin
        // request; the ingest parses the JSON body regardless of content-type.
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
      })
        .then((res) => {
          if (res.ok) this.verified = true;
          else this.stop();
        })
        .catch(() => this.stop());
      return;
    }

    // No fetch available: last-resort sendBeacon (cannot observe the result).
    if (!this.trySendBeacon(body)) this.stop();
  }

  private trySendBeacon(body: string): boolean {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (!nav || typeof nav.sendBeacon !== "function") return false;
    try {
      return nav.sendBeacon(ENDPOINT, body);
    } catch {
      return false;
    }
  }
}
