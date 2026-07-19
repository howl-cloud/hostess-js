import type { RouteInfo, RouteProvider } from "./types";

/** Strip the query string and hash, leaving only the path. */
export function stripQuery(pathOrUrl: string): string {
  let end = pathOrUrl.length;
  const q = pathOrUrl.indexOf("?");
  const h = pathOrUrl.indexOf("#");
  if (q >= 0) end = Math.min(end, q);
  if (h >= 0) end = Math.min(end, h);
  return pathOrUrl.slice(0, end);
}

// history.pushState / replaceState do not emit an event. Patch them once (per
// page) to dispatch one, so the default provider can observe SPA navigations
// without every provider stacking its own monkey-patch. popstate covers
// back/forward natively.
const LOCATION_CHANGE_EVENT = "hostess:locationchange";
const HISTORY_PATCH_FLAG = "__hostess_history_patched__";

function ensureHistoryEvents(): void {
  const w = window as unknown as Record<string, boolean>;
  if (w[HISTORY_PATCH_FLAG]) return;
  w[HISTORY_PATCH_FLAG] = true;

  for (const method of ["pushState", "replaceState"] as const) {
    const original = history[method];
    history[method] = function (this: History, ...args: Parameters<History[typeof method]>) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
      return result;
    };
  }
}

/**
 * Default provider with no framework knowledge: `location.pathname` is used as
 * both the route template and the concrete path — correct for non-parameterized
 * sites, and the ingest's route-hygiene caps absorb the rest. It also emits
 * navigation changes (pushState/replaceState → "spa", popstate →
 * "back-forward") so `inject()` is useful standalone in a bare SPA; adapters
 * that supply real templates replace this entirely.
 */
export function defaultRouteProvider(): RouteProvider {
  const read = (): RouteInfo => {
    const path = typeof location !== "undefined" ? location.pathname : "/";
    return { route: path, path };
  };

  return {
    current: read,
    onChange(cb) {
      if (typeof window === "undefined") return () => {};
      ensureHistoryEvents();

      let last = location.pathname;
      const emit = (nav: "spa" | "back-forward") => () => {
        const path = location.pathname;
        if (path === last) return; // ignore hash-only / query-only changes
        last = path;
        cb({ route: path, path }, nav);
      };

      const onSpa = emit("spa");
      const onPop = emit("back-forward");
      window.addEventListener(LOCATION_CHANGE_EVENT, onSpa);
      window.addEventListener("popstate", onPop);

      return () => {
        window.removeEventListener(LOCATION_CHANGE_EVENT, onSpa);
        window.removeEventListener("popstate", onPop);
      };
    },
  };
}
