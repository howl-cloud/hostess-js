"use client";

import { inject } from "@hostess/browser";

import { useHostessRoutes } from "./use-hostess-routes";
import { SDK_VERSION } from "./version";

export interface AnalyticsProps {
  /** Log would-be beacons to the console (still sent unless in development). */
  debug?: boolean;
}

/**
 * Audience Analytics for Next.js — page-view beacons with reconstructed route
 * templates. Drop into the root layout:
 *
 *     import { Analytics } from "@hostess/nextjs";
 *     // <Analytics />
 *
 * A `"use client"` leaf that renders nothing; its only job is to feed the
 * Next-specific route provider into `@hostess/browser`. Works in both the App
 * and Pages Routers, and unchanged under `output: "export"` (static sites).
 */
export function Analytics({ debug }: AnalyticsProps = {}): null {
  useHostessRoutes(inject, debug, `nextjs@${SDK_VERSION}`);
  return null;
}
