// @hostess/nextjs — server instrumentation entry (v0.1).
//
// In your app's instrumentation.ts:
//
//     export { register, onRequestError } from "@hostess/nextjs";
//
// Client-side Audience & Speed Insights (<Analytics /> / <SpeedInsights />) are
// a later phase (they depend on the RUM ingest path) and will ship under a
// dedicated client entry.

export { register } from "./register";
export { onRequestError } from "./on-request-error";
export { SDK_VERSION } from "./version";
