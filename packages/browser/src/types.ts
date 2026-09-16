// Beacon wire contract shared with the platform ingest; keep fields and v: 1 in lockstep.

export type DeviceClass = "desktop" | "mobile" | "tablet";
export type NavType = "load" | "spa" | "back-forward";
export type BeaconKind = "pv" | "wv";
export type WebVitalName = "LCP" | "CLS" | "INP" | "FCP" | "TTFB";
export type Rating = "good" | "needs-improvement" | "poor";

export interface RouteInfo {
  /** Route template, e.g. `/blog/[slug]`. Equals `path` when no adapter. */
  route: string;
  /** Concrete path, e.g. `/blog/hello-world`. Query string stripped. */
  path: string;
}

/** Framework seam: adapters supply route templates; default uses pathname for both. */
export interface RouteProvider {
  current(): RouteInfo;
  onChange(cb: (info: RouteInfo, nav: "spa" | "back-forward") => void): () => void;
}

export interface Utm {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

interface BaseBeacon {
  v: 1;
  k: BeaconKind;
  route: string;
  path: string;
  /** Referrer origin only, "" for same-origin/direct. */
  ref: string;
  utm: Utm;
  nav: NavType;
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
  debug?: boolean;
  /** sdk field override; reserved for adapters. */
  sdk?: string;
}
