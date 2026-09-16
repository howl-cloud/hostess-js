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
