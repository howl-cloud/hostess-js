"use client";

// Client components entry ("use client" works in both routers). Server-only
// code lives at @hostess/nextjs/server; merging them breaks the Pages build.

export { Analytics, type AnalyticsProps } from "./analytics";
export { SpeedInsights, type SpeedInsightsProps } from "./speed-insights";
export { SDK_VERSION } from "./version";
