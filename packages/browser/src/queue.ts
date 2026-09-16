import type { Beacon } from "./types";
import { isHidden } from "./env";

// Same-origin ingest path; no CORS.
const ENDPOINT = "/_hostess/rum";

// A request carries at most 20 beacons and 8 KB; flushes split to fit both.
const MAX_BEACONS = 20;
const MAX_BYTES = 8 * 1024;

const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

function byteLength(s: string): number {
  return encoder ? encoder.encode(s).length : s.length;
}

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
 * Page-lifetime queue shared by inject/injectSpeedInsights. Flushes when full,
 * on hidden, or when a beacon lands while hidden (covers CLS/INP regardless
 * of listener order). Probes via fetch until first success (404 or network
 * error stops the queue); then prefers sendBeacon, which survives unload.
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

    if (this.verified && this.trySendBeacon(body)) return;

    if (typeof fetch === "function") {
      fetch(ENDPOINT, {
        method: "POST",
        body,
        keepalive: true,
        credentials: "omit",
        // text/plain keeps this a simple request; the ingest parses JSON regardless.
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
      })
        .then((res) => {
          if (res.ok) this.verified = true;
          else this.stop();
        })
        .catch(() => this.stop());
      return;
    }

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
