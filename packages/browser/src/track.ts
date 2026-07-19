/**
 * Custom events — phase 2 (howl-cloud/hostess-js#3). Exported now as a typed
 * no-op so adapters can re-export it today and the real implementation lands
 * without a breaking API change. Records nothing yet.
 */
export function track(
  _name: string,
  _props?: Record<string, string | number | boolean>,
): void {
  // Intentionally empty until custom-event ingest exists.
}
