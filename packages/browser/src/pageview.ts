import type { InjectOptions, NavType, PageviewBeacon, RouteInfo } from "./types";
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

/**
 * Start collecting page views: one `pv` beacon on initial load, then one per
 * SPA navigation reported by the route provider. Idempotent — a second call is
 * a no-op. Safe to call during SSR (no-ops without a DOM).
 */
export function inject(opts: InjectOptions = {}): void {
  if (!hasDom()) return;

  const st = state();
  if (st.pv) return;
  st.pv = true;

  const provider = opts.routeProvider ?? defaultRouteProvider();
  const debug = opts.debug ?? false;
  const sdk = opts.sdk ?? defaultSdk();

  emitPageview(provider.current(), "load", debug, sdk);
  provider.onChange((info, nav) => emitPageview(info, nav, debug, sdk));
}

function emitPageview(info: RouteInfo, nav: NavType, debug: boolean, sdk: string): void {
  const beacon: PageviewBeacon = {
    v: 1,
    k: "pv",
    route: info.route,
    path: stripQuery(info.path),
    ref: referrerOrigin(),
    utm: extractUtm(),
    nav,
    dc: deviceClass(),
    sdk,
  };
  report(beacon, debug);
}
