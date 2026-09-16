import Router from "next/router";
import type { RouteInfo, RouteProvider } from "@hostess/browser";

import { stripQuery } from "./compute-route";

export function pagesRouteInfo(): RouteInfo {
  const router = Router.router;
  const asPath = router?.asPath ?? (typeof location !== "undefined" ? location.pathname : "/");
  const path = stripQuery(asPath);
  const route = router?.route ?? path;
  return { route, path };
}

type RouteChangeHandler = Parameters<RouteProvider["onChange"]>[0];

export function subscribeToPagesRouter(cb: RouteChangeHandler): () => void {
  let nav: "spa" | "back-forward" = "spa";
  const onPop = () => {
    nav = "back-forward";
  };
  if (typeof window !== "undefined") {
    window.addEventListener("popstate", onPop);
  }
  const onComplete = () => {
    cb(pagesRouteInfo(), nav);
    nav = "spa";
  };
  Router.events?.on("routeChangeComplete", onComplete);
  return () => {
    Router.events?.off("routeChangeComplete", onComplete);
    if (typeof window !== "undefined") {
      window.removeEventListener("popstate", onPop);
    }
  };
}

export function pagesRouteProvider(): RouteProvider {
  return {
    current: pagesRouteInfo,
    onChange: subscribeToPagesRouter,
  };
}
