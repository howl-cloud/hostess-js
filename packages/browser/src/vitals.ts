import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals/attribution";
import type { Metric } from "web-vitals";

import type { InjectOptions, NavType, RouteProvider, WebVitalBeacon } from "./types";
import { hasDom } from "./env";
import { state } from "./state";
import { defaultRouteProvider, stripQuery } from "./route";
import { referrerOrigin } from "./referrer";
import { extractUtm } from "./utm";
import { deviceClass } from "./device";
import { report } from "./report";
import { SDK_VERSION } from "./version";

function defaultSdk(): string {
  return `browser@${SDK_VERSION}`;
}

/** Collect Core Web Vitals via web-vitals (no FID, deprecated). Idempotent; SSR-safe. */
export function injectSpeedInsights(opts: InjectOptions = {}): void {
  if (!hasDom()) return;

  const st = state();
  if (st.wv) return;
  st.wv = true;

  const provider = opts.routeProvider ?? defaultRouteProvider();
  const debug = opts.debug ?? false;
  const sdk = opts.sdk ?? defaultSdk();

  const handler = (metric: Metric) => emitVital(metric, provider, debug, sdk);
  onLCP(handler);
  onCLS(handler);
  onINP(handler);
  onFCP(handler);
  onTTFB(handler);
}

function emitVital(metric: Metric, provider: RouteProvider, debug: boolean, sdk: string): void {
  const info = provider.current();
  const beacon: WebVitalBeacon = {
    v: 1,
    k: "wv",
    route: info.route,
    path: stripQuery(info.path),
    ref: referrerOrigin(),
    utm: extractUtm(),
    nav: navFromMetric(metric.navigationType),
    dc: deviceClass(),
    sdk,
    m: metric.name,
    val: metricValue(metric),
    rating: metric.rating,
  };
  report(beacon, debug);
}

// web-vitals ignores SPA navigations; vitals are load or back-forward only.
function navFromMetric(navigationType: Metric["navigationType"]): NavType {
  return navigationType === "back-forward" || navigationType === "back-forward-cache"
    ? "back-forward"
    : "load";
}

// CLS is unitless (4 decimals); ms metrics round to whole ms.
function metricValue(metric: Metric): number {
  return metric.name === "CLS"
    ? Math.round(metric.value * 10000) / 10000
    : Math.round(metric.value);
}
