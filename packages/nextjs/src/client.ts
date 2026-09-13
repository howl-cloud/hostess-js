import { defaultRouteProvider, inject, injectSpeedInsights } from "@hostess/browser";
import type { RouteProvider } from "@hostess/browser";
import Router from "next/router";

import { pagesRouteProvider } from "./pages-route-provider";
import { SDK_VERSION } from "./version";

export interface RegisterClientOptions {
  /** Log would-be beacons to the console (still sent unless in development). */
  debug?: boolean;
}

let registered = false;

function pagesDocument(): boolean {
  return document.getElementById("__NEXT_DATA__") != null;
}

/**
 * Browser Insights without a layout change — call once from
 * `instrumentation-client.ts`:
 *
 *     import { registerClient } from "@hostess/nextjs/client";
 *     registerClient();
 *
 * Pages Router (`__NEXT_DATA__` or an already-created `Router.router`) waits
 * for `Router.ready` so the first pageview uses `Router.route` (`/blog/[slug]`),
 * not `location.pathname`. App Router starts immediately with the default
 * provider.
 */
export function registerClient(opts: RegisterClientOptions = {}): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (registered) return;
  registered = true;

  const start = (provider: RouteProvider) => {
    const debug = opts.debug;
    const sdk = `nextjs@${SDK_VERSION}`;
    inject({ routeProvider: provider, debug, sdk });
    injectSpeedInsights({ routeProvider: provider, debug, sdk });
  };

  if (Router.router != null) {
    start(pagesRouteProvider());
    return;
  }

  if (!pagesDocument()) {
    start(defaultRouteProvider());
    return;
  }

  Router.ready(() => start(Router.router != null ? pagesRouteProvider() : defaultRouteProvider()));
}
