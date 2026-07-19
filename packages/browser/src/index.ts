// @hostess/browser — framework-agnostic browser core for Hostess Audience
// Analytics and Speed Insights.
//
//   import { inject, injectSpeedInsights } from "@hostess/browser";
//   inject();               // page views
//   injectSpeedInsights();  // Core Web Vitals
//
// Framework adapters (e.g. @hostess/nextjs) build <Analytics /> /
// <SpeedInsights /> on top of these by passing a RouteProvider.

export { inject } from "./pageview";
export { injectSpeedInsights } from "./vitals";
export { track } from "./track";
export { defaultRouteProvider } from "./route";
export { SDK_VERSION } from "./version";

export type {
  RouteInfo,
  RouteProvider,
  InjectOptions,
  Beacon,
  PageviewBeacon,
  WebVitalBeacon,
  Utm,
  DeviceClass,
  NavType,
  BeaconKind,
  WebVitalName,
  Rating,
} from "./types";
