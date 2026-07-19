"use client";

import { injectSpeedInsights } from "@hostess/browser";

import { useHostessRoutes } from "./use-hostess-routes";
import { SDK_VERSION } from "./version";

export interface SpeedInsightsProps {
  /** Log would-be beacons to the console (still sent unless in development). */
  debug?: boolean;
}

/**
 * Speed Insights for Next.js — Core Web Vitals (LCP, CLS, INP, FCP, TTFB) tagged
 * with reconstructed route templates. Drop into the root layout:
 *
 *     import { SpeedInsights } from "@hostess/nextjs";
 *     // <SpeedInsights />
 *
 * A `"use client"` leaf that renders nothing; it feeds the Next-specific route
 * provider into `@hostess/browser`. Works in both routers and under static
 * export.
 */
export function SpeedInsights({ debug }: SpeedInsightsProps = {}): null {
  useHostessRoutes(injectSpeedInsights, debug, `nextjs@${SDK_VERSION}`);
  return null;
}
