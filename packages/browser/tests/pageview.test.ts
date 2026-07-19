import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { inject } from "../src/pageview";
import type { PageviewBeacon, RouteProvider } from "../src/types";

// Collect every beacon body posted through the transport.
function captureBeacons(): PageviewBeacon[] {
  const sent: PageviewBeacon[] = [];
  const sendBeacon = vi.fn((_url: string, body: string) => {
    for (const b of JSON.parse(body)) sent.push(b);
    return true;
  });
  (navigator as { sendBeacon?: unknown }).sendBeacon = sendBeacon;
  // Verify the endpoint on the first fetch so subsequent sends use sendBeacon.
  vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => {
    for (const b of JSON.parse(init.body as string)) sent.push(b);
    return Promise.resolve({ ok: true } as Response);
  }));
  return sent;
}

function hide(): void {
  Object.defineProperty(document, "visibilityState", {
    value: "hidden",
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function resetState(): void {
  delete (window as Record<string, unknown>).__hostess_rum__;
  delete (window as Record<string, unknown>).__hostess_history_patched__;
}

describe("inject (pageviews)", () => {
  beforeEach(() => {
    resetState();
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    window.history.replaceState({}, "", "/start");
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
  });

  it("emits one schema-v1 pv beacon on load with all required fields", () => {
    const sent = captureBeacons();
    inject();
    hide();

    expect(sent).toHaveLength(1);
    const beacon = sent[0];
    expect(beacon).toMatchObject({
      v: 1,
      k: "pv",
      route: "/start",
      path: "/start",
      ref: "",
      utm: {},
      nav: "load",
      sdk: "browser@0.1.0",
    });
    expect(["desktop", "mobile", "tablet"]).toContain(beacon.dc);
    // No extra/unknown fields leaked onto the wire.
    expect(Object.keys(beacon).sort()).toEqual(
      ["dc", "k", "nav", "path", "ref", "sdk", "utm", "v", "route"].sort(),
    );
  });

  it("strips the query string but keeps utm params in `utm`", () => {
    window.history.replaceState({}, "", "/pricing?utm_source=hn&plan=pro");
    const sent = captureBeacons();
    inject();
    hide();

    expect(sent[0].path).toBe("/pricing");
    expect(sent[0].utm).toEqual({ source: "hn" });
    expect(JSON.stringify(sent[0])).not.toContain("plan");
  });

  it("is strictly idempotent — a second inject() adds no beacon", () => {
    const sent = captureBeacons();
    inject();
    inject();
    inject();
    hide();

    expect(sent.filter((b) => b.nav === "load")).toHaveLength(1);
  });

  it("emits pv beacons for SPA navigations from a route provider", () => {
    const listeners: Array<(info: { route: string; path: string }, nav: "spa" | "back-forward") => void> = [];
    const provider: RouteProvider = {
      current: () => ({ route: "/blog/[slug]", path: "/blog/first" }),
      onChange: (cb) => {
        listeners.push(cb);
        return () => {};
      },
    };

    const sent = captureBeacons();
    inject({ routeProvider: provider });
    listeners[0]({ route: "/blog/[slug]", path: "/blog/second" }, "spa");
    hide();

    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({ route: "/blog/[slug]", path: "/blog/first", nav: "load" });
    expect(sent[1]).toMatchObject({ route: "/blog/[slug]", path: "/blog/second", nav: "spa" });
  });

  it("sends nothing in development but debug logs the would-be payload", () => {
    process.env.NODE_ENV = "development";
    const sent = captureBeacons();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    inject({ debug: true });
    hide();

    expect(sent).toHaveLength(0);
    expect(log).toHaveBeenCalledWith("[hostess/browser]", expect.objectContaining({ k: "pv" }));
  });

  it("does not touch cookies or localStorage", () => {
    const sent = captureBeacons();
    const before = document.cookie;
    inject();
    hide();

    expect(document.cookie).toBe(before);
    expect(sent).toHaveLength(1);
  });
});
