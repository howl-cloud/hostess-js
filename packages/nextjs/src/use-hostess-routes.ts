import { useEffect, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import type { InjectOptions, RouteInfo, RouteProvider } from "@hostess/browser";

import { computeRoute, type RouteParams } from "./compute-route";
import { pagesRouteInfo, subscribeToPagesRouter } from "./pages-route-provider";

type Injector = (opts: InjectOptions) => void;
type NavKind = "spa" | "back-forward";

/**
 * Bridge Next router state to the browser RouteProvider; mount the injector once.
 * App Router iff usePathname() is non-null (null outside App tree); else Pages.
 * Hooks stay unconditional; no useSearchParams (avoids a Suspense boundary).
 * StrictMode-safe via a mount guard + idempotent browser core.
 */
export function useHostessRoutes(inject: Injector, debug: boolean | undefined, sdk: string): void {
  const appPathname = usePathname();
  const appParams = useParams();
  const isApp = appPathname != null;

  // Latest route; App updates during render, Pages in effects.
  const infoRef = useRef<RouteInfo>({ route: "/", path: "/" });
  const cbRef = useRef<((info: RouteInfo, nav: NavKind) => void) | null>(null);
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

  // Reconstruct synchronously so the provider is fresh before mount.
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
    // Page-lifetime subscription; no cleanup needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isApp || typeof window === "undefined") return;
    const onPop = () => {
      navRef.current = "back-forward";
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Fire on pathname change only; search-only navigations dedupe for free.
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

  useEffect(() => {
    if (isApp) return;
    return subscribeToPagesRouter((info, nav) => {
      infoRef.current = info;
      cbRef.current?.(info, nav);
    });
  }, [isApp]);
}
