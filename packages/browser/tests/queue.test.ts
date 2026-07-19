import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BeaconQueue, splitBatches } from "../src/queue";
import type { Beacon, PageviewBeacon } from "../src/types";

function pv(path = "/"): PageviewBeacon {
  return {
    v: 1,
    k: "pv",
    route: path,
    path,
    ref: "",
    utm: {},
    nav: "load",
    dc: "desktop",
    sdk: "browser@0.1.0",
  };
}

function setVisibility(value: "visible" | "hidden"): void {
  Object.defineProperty(document, "visibilityState", {
    value,
    configurable: true,
  });
}

describe("splitBatches", () => {
  it("caps a batch at 20 beacons", () => {
    const beacons: Beacon[] = Array.from({ length: 45 }, () => pv());
    const batches = splitBatches(beacons);
    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(20);
    expect(batches[1]).toHaveLength(20);
    expect(batches[2]).toHaveLength(5);
  });

  it("caps a batch at 8 KB even when under 20 beacons", () => {
    // A ~1 KB path makes each beacon large enough that far fewer than 20 fit.
    const big = "/" + "x".repeat(1024);
    const beacons: Beacon[] = Array.from({ length: 20 }, () => pv(big));
    const batches = splitBatches(beacons);
    expect(batches.length).toBeGreaterThan(1);
    for (const batch of batches) {
      expect(batch.length).toBeLessThanOrEqual(20);
      expect(new TextEncoder().encode(JSON.stringify(batch)).length).toBeLessThanOrEqual(
        8 * 1024,
      );
    }
  });
});

describe("BeaconQueue transport", () => {
  beforeEach(() => {
    setVisibility("visible");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
  });

  it("posts via fetch(keepalive) to /_hostess/rum when unverified", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const q = new BeaconQueue();
    q.push(pv("/a"));
    q.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/_hostess/rum");
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(JSON.parse(init.body)).toEqual([pv("/a")]);
  });

  it("prefers sendBeacon once the endpoint is verified", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const sendBeacon = vi.fn().mockReturnValue(true);
    (navigator as { sendBeacon?: unknown }).sendBeacon = sendBeacon;

    const q = new BeaconQueue();
    q.push(pv("/a"));
    q.flush();
    await Promise.resolve(); // let the fetch .then set verified

    q.push(pv("/b"));
    q.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon.mock.calls[0][0]).toBe("/_hostess/rum");
  });

  it("stops for the page lifetime after a 404 and never sends again", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const q = new BeaconQueue();
    q.push(pv("/a"));
    q.flush();
    await Promise.resolve();

    q.push(pv("/b"));
    q.flush();
    q.push(pv("/c"));
    q.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after a network error (fetch rejects)", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network"));
    vi.stubGlobal("fetch", fetchMock);

    const q = new BeaconQueue();
    q.push(pv("/a"));
    q.flush();
    await Promise.resolve();
    await Promise.resolve();

    q.push(pv("/b"));
    q.flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("flushes immediately when a beacon is enqueued while hidden", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);
    setVisibility("hidden");

    const q = new BeaconQueue();
    q.push(pv("/late-vital")); // no explicit flush() call

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("flushes buffered beacons on visibilitychange -> hidden", () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const q = new BeaconQueue();
    q.push(pv("/a")); // visible: buffered, not sent
    expect(fetchMock).not.toHaveBeenCalled();

    setVisibility("hidden");
    document.dispatchEvent(new Event("visibilitychange"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
