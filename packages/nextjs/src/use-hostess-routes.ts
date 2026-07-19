import { useEffect, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import Router from "next/router";
import type { InjectOptions, RouteInfo, RouteProvider } from "@hostess/browser";

import { computeRoute, stripQuery, type RouteParams } from "./compute-route";

type Injector = (opts: InjectOptions) => void;
type NavKind = "spa" | "back-forward";

/**
 * Bridges Next's router state to the `@hostess/browser` `RouteProvider` seam and
 * mounts the given injector (`inject` or `injectSpeedInsights`) exactly once.
 *
 * Router detection: the App Router hooks (`usePathname`/`useParams` from
 * `next/navigation`) return `null` outside an App Router tree, so a non-null
 * pathname means App Router; otherwise we fall back to the imperative
 * `next/router` singleton for the Pages Router. Both hooks are called
 * unconditionally every render (stable hook order); only the resulting branch
 * differs. `useSearchParams` is deliberately not used — it would force a
 * `<Suspense>` boundary, and we dedupe on pathname anyway.
 *
 * Strict-mode / remount safe: a ref guards the one-time injection, and the
 * browser core is itself idempotent (a window singleton), so a double mount
 * cannot double-count.
 */
export function useHostessRoutes(inject: Injector, debug: boolean | undefined, sdk: string): void {
  const appPathname = usePathname();
  const appParams = useParams();
  const isApp = appPathname != null;

  // Latest route info, read by the provider's `current()`. Updated during
  // render for the App Router (reactive) and in effects for the Pages Router.
  const infoRef = useRef<RouteInfo>({ route: "/", path: "/" });
  // The browser core's subscriber, captured when `inject` calls `onChange`.
  const cbRef = useRef<((info: RouteInfo, nav: NavKind) => void) | null>(null);
  // popstate marks the next navigation as back/forward.
  const navRef = useRef<NavKind>("spa");

  const providerRef = useRef<RouteProvider>();
  if (!providerRef.current) {
    providerRef.current = {
      current: () => infoRef.current,
      onChange: (cb) => {
        cbRef.current = cb;
        return () => {
          cbRef.current = null;
        };
      },
    };
  }

  // App Router: reconstruct the template synchronously so the provider is fresh
  // before the mount effect fires the initial beacon.
  let appRoute = "";
  if (isApp) {
    appRoute = computeRoute(appPathname, (appParams ?? {}) as RouteParams) ?? appPathname;
    infoRef.current = { route: appRoute, path: appPathname };
  }

  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    if (!isApp) infoRef.current = pagesRouteInfo();
    inject({ routeProvider: providerRef.current!, debug, sdk });
    // Subscription is page-lifetime (these components live in the root layout);
    // no cleanup, and re-invocation is a no-op via the guard + core idempotence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Distinguish back/forward from forward SPA navigations.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => {
      navRef.current = "back-forward";
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // App Router navigations: fire on pathname change only. `usePathname()` does
  // not change on a search-param-only navigation, so those are deduped for free
  // (the initial view is already sent by the mount effect above).
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    if (!isApp) return;
    if (lastPath.current === null) {
      lastPath.current = appPathname;
      return;
    }
    if (appPathname === lastPath.current) return;
    lastPath.current = appPathname;
    cbRef.current?.({ route: appRoute, path: appPathname }, navRef.current);
    navRef.current = "spa";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApp, appPathname, appRoute]);

  // Pages Router navigations: the template is free on `router.route`.
  useEffect(() => {
    if (isApp) return;
    const onComplete = () => {
      const info = pagesRouteInfo();
      infoRef.current = info;
      cbRef.current?.(info, navRef.current);
      navRef.current = "spa";
    };
    Router.events?.on("routeChangeComplete", onComplete);
    return () => {
      Router.events?.off("routeChangeComplete", onComplete);
    };
  }, [isApp]);
}

// Read the Pages Router's current template + concrete path from the imperative
// singleton. `Router.route` is the template (e.g. `/blog/[slug]`); `asPath` is
// the concrete path with the query string, which we strip.
function pagesRouteInfo(): RouteInfo {
  const router = Router.router;
  const asPath = router?.asPath ?? (typeof location !== "undefined" ? location.pathname : "/");
  const path = stripQuery(asPath);
  const route = router?.route ?? path;
  return { route, path };
}
