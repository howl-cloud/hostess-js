/**
 * Shared resolution helpers: enabled flag, OTLP endpoint, signal paths, and the
 * runtime guard. Kept side-effect-free so they're trivially testable.
 */

const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

/** Default-on; disabled only by an explicit falsey HOSTESS_INSTRUMENTATION. */
export function isEnabled(): boolean {
  const raw = process.env.HOSTESS_INSTRUMENTATION;
  if (raw && FALSE_VALUES.has(raw.trim().toLowerCase())) return false;
  return true;
}

/**
 * Resolve the OTLP base endpoint. Precedence: platform-injected
 * HOSTESS_OTEL_ENDPOINT → OTEL_EXPORTER_OTLP_ENDPOINT.
 */
export function resolveEndpoint(): string | undefined {
  for (const candidate of [
    process.env.HOSTESS_OTEL_ENDPOINT,
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  ]) {
    if (candidate && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

/** Append the OTLP/HTTP signal path (`v1/traces`, `v1/metrics`), idempotently. */
export function signalEndpoint(base: string, signal: "traces" | "metrics"): string {
  const trimmed = base.replace(/\/+$/, "");
  const suffix = `/v1/${signal}`;
  return trimmed.endsWith(suffix) ? trimmed : trimmed + suffix;
}

/**
 * The OTel Node SDK only runs on the Node.js runtime. On the edge runtime we
 * no-op in v0.1 (a fetch-based exporter is a future enhancement).
 */
export function isNodeRuntime(): boolean {
  return (process.env.NEXT_RUNTIME ?? "nodejs") === "nodejs";
}
