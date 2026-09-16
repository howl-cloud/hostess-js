"use client";

import { inject } from "@hostess/browser";

import { useHostessRoutes } from "./use-hostess-routes";
import { SDK_VERSION } from "./version";

export interface AnalyticsProps {
  debug?: boolean;
}

/** Page-view beacons with route templates. Drop into the root layout; renders nothing. */
export function Analytics({ debug }: AnalyticsProps = {}): null {
  useHostessRoutes(inject, debug, `nextjs@${SDK_VERSION}`);
  return null;
}
