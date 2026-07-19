// Public types + the beacon wire contract (schema v1, howl-cloud/hostess#32).
// The beacon shapes below are the single source of truth shared with the
// platform ingest; keep field names and the `v: 1` version in lockstep with it.

export type DeviceClass = "desktop" | "mobile" | "tablet";
export type NavType = "load" | "spa" | "back-forward";
export type BeaconKind = "pv" | "wv";
export type WebVitalName = "LCP" | "CLS" | "INP" | "FCP" | "TTFB";
export type Rating = "good" | "needs-improvement" | "poor";

/** Template + concrete path for a page view. Query string is always stripped. */
export interface RouteInfo {
  /** Route template, e.g. `/blog/[slug]`. Equals `path` when no adapter. */
  route: string;
  /** Concrete path, e.g. `/blog/hello-world`. Query string stripped. */
  path: string;
}

/**
 * The single framework-specific seam. Adapters (e.g. `@hostess/nextjs`)
 * implement this to supply real route templates and navigation events; the
 * default provider uses `location.pathname` for both `route` and `path`.
 */
export interface RouteProvider {
  current(): RouteInfo;
  /** Subscribe to client-side navigations. Returns an unsubscribe function. */
  onChange(cb: (info: RouteInfo, nav: "spa" | "back-forward") => void): () => void;
}

/** The five UTM parameters, extracted client-side. Only present keys are set. */
export interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

interface BaseBeacon {
  /** Schema version. */
  v: 1;
  /** Beacon kind: pageview or web vital. */
  k: BeaconKind;
  route: string;
  path: string;
  /** Referrer origin only, "" for same-origin/direct. */
  ref: string;
  utm: Utm;
  nav: NavType;
  /** Coarse device class (UA-CH with UA fallback). */
  dc: DeviceClass;
  /** `<adapter>@<version>`, e.g. `browser@0.1.0`. */
  sdk: string;
}

export interface PageviewBeacon extends BaseBeacon {
  k: "pv";
}

export interface WebVitalBeacon extends BaseBeacon {
  k: "wv";
  m: WebVitalName;
  /** Value in ms; CLS is unitless. */
  val: number;
  rating: Rating;
}

export type Beacon = PageviewBeacon | WebVitalBeacon;

export interface InjectOptions {
  /** Adapter-supplied route source. Defaults to a `location.pathname` provider. */
  routeProvider?: RouteProvider;
  /** Log would-be payloads to the console; still sends unless in development. */
  debug?: boolean;
  /**
   * Override the `sdk` field. Framework adapters pass their own identifier
   * (e.g. `nextjs@0.2.0`); defaults to `browser@<version>`. Not part of the
   * documented public surface — reserved for adapters.
   */
  sdk?: string;
}
