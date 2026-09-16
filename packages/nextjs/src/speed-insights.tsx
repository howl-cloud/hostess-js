"use client";

import { injectSpeedInsights } from "@hostess/browser";

import { useHostessRoutes } from "./use-hostess-routes";
import { SDK_VERSION } from "./version";

export interface SpeedInsightsProps {
  debug?: boolean;
}

/** Core Web Vitals with route templates. Drop into the root layout; renders nothing. */
export function SpeedInsights({ debug }: SpeedInsightsProps = {}): null {
  useHostessRoutes(injectSpeedInsights, debug, `nextjs@${SDK_VERSION}`);
  return null;
}
