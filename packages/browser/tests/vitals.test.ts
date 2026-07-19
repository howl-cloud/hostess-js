import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Metric } from "web-vitals";

// Capture the callbacks web-vitals would register, so tests can drive metrics
// synchronously instead of waiting on real performance entries.
const handlers: Record<string, (m: Metric) => void> = {};
vi.mock("web-vitals/attribution", () => ({
  onLCP: (cb: (m: Metric) => void) => (handlers.LCP = cb),
  onCLS: (cb: (m: Metric) => void) => (handlers.CLS = cb),
  onINP: (cb: (m: Metric) => void) => (handlers.INP = cb),
  onFCP: (cb: (m: Metric) => void) => (handlers.FCP = cb),
  onTTFB: (cb: (m: Metric) => void) => (handlers.TTFB = cb),
}));

import { injectSpeedInsights } from "../src/vitals";
import type { WebVitalBeacon } from "../src/types";

function metric(partial: Partial<Metric> & Pick<Metric, "name" | "value" | "rating">): Metric {
  return {
    delta: partial.value,
    id: "v1-1",
    entries: [],
    navigationType: "navigate",
    ...partial,
  } as Metric;
}

function captureBeacons(): WebVitalBeacon[] {
  const sent: WebVitalBeacon[] = [];
  vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => {
    for (const b of JSON.parse(init.body as string)) sent.push(b);
    return Promise.resolve({ ok: true } as Response);
  }));
  return sent;
}

function hide(): void {
  Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

function resetState(): void {
  delete (window as Record<string, unknown>).__hostess_rum__;
}

describe("injectSpeedInsights (web vitals)", () => {
  beforeEach(() => {
    resetState();
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    window.history.replaceState({}, "", "/dash");
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (navigator as { sendBeacon?: unknown }).sendBeacon;
    for (const k of Object.keys(handlers)) delete handlers[k];
  });

  it("registers all five metrics and no FID", () => {
    injectSpeedInsights();
    expect(Object.keys(handlers).sort()).toEqual(["CLS", "FCP", "INP", "LCP", "TTFB"]);
    expect(handlers).not.toHaveProperty("FID");
  });

  it("emits a schema-v1 wv beacon with m/val/rating", () => {
    const sent = captureBeacons();
    injectSpeedInsights();
    handlers.LCP(metric({ name: "LCP", value: 2412.6, rating: "good" }));
    hide();

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      v: 1,
      k: "wv",
      route: "/dash",
      m: "LCP",
      val: 2413, // rounded to whole ms
      rating: "good",
      nav: "load",
      sdk: "browser@0.1.0",
    });
  });

  it("keeps CLS unitless with decimals, not rounded to an integer", () => {
    const sent = captureBeacons();
    injectSpeedInsights();
    handlers.CLS(metric({ name: "CLS", value: 0.04731, rating: "good" }));
    hide();

    expect(sent[0].val).toBeCloseTo(0.0473, 4);
    expect(sent[0].m).toBe("CLS");
  });

  it("maps a bfcache navigation to nav: back-forward", () => {
    const sent = captureBeacons();
    injectSpeedInsights();
    handlers.INP(metric({ name: "INP", value: 180, rating: "good", navigationType: "back-forward" }));
    hide();

    expect(sent[0].nav).toBe("back-forward");
  });

  it("is silent in development", () => {
    process.env.NODE_ENV = "development";
    const sent = captureBeacons();
    injectSpeedInsights();
    handlers.LCP(metric({ name: "LCP", value: 1000, rating: "good" }));
    hide();

    expect(sent).toHaveLength(0);
  });

  it("is idempotent — a second call does not double-register", () => {
    injectSpeedInsights();
    const firstLcp = handlers.LCP;
    injectSpeedInsights();
    expect(handlers.LCP).toBe(firstLcp);
  });
});
