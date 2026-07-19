"use client";

// @hostess/nextjs — root entry (the client components).
//
//     // app/layout.tsx (App Router) or pages/_app.tsx (Pages Router)
//     import { Analytics, SpeedInsights } from "@hostess/nextjs";
//
// This is a real `"use client"` module, so it resolves cleanly in both routers:
// the App Router treats it as a client boundary, and the Pages Router (which has
// no RSC machinery) bundles it as an ordinary client module. Server-only
// instrumentation lives at `@hostess/nextjs/server` — a single root that tried
// to serve both breaks the Pages Router build, because that pipeline resolves a
// single entry for the package per pass and cannot reconcile a server module
// that re-exports `"use client"` components (see the package README).

export { Analytics, type AnalyticsProps } from "./analytics";
export { SpeedInsights, type SpeedInsightsProps } from "./speed-insights";
export { SDK_VERSION } from "./version";
