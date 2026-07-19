import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

import { isEnabled, isNodeRuntime, resolveEndpoint, signalEndpoint } from "./otel";
import { startMarkerHeartbeat } from "./marker";
import { SDK_VERSION } from "./version";
import { readNextVersion } from "./next-version";

let registered = false;

/**
 * Server instrumentation entry. Re-export from `instrumentation.ts`:
 *
 *     export { register, onRequestError } from "@hostess/nextjs/server";
 *
 * Registers a minimal NodeTracerProvider whose OTLP exporter points at the
 * platform-injected collector, then relies on Next.js's native span emission
 * (route templates, method, status come from Next itself). Calling
 * `provider.register()` also installs the W3C propagators so server-side
 * `fetch` carries trace context to downstream services.
 *
 * Idempotent; a clean no-op when disabled, on the edge runtime, or when no
 * collector endpoint is available; fails silent so it never degrades the app.
 */
export function register(): void {
  if (registered) return;
  if (!isEnabled() || !isNodeRuntime()) return;

  const endpoint = resolveEndpoint();
  if (!endpoint) return;

  try {
    const frameworkVersion = readNextVersion();
    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.HOSTESS_SERVICE_NAME ?? process.env.OTEL_SERVICE_NAME,
      "hostess.sdk.language": "js",
      "hostess.sdk.version": SDK_VERSION,
      "hostess.framework": "nextjs",
      "hostess.framework.version": frameworkVersion,
    });

    const provider = new NodeTracerProvider({
      resource,
      spanProcessors: [
        new BatchSpanProcessor(
          new OTLPTraceExporter({ url: signalEndpoint(endpoint, "traces") }),
        ),
      ],
    });
    provider.register();

    startMarkerHeartbeat({
      resource,
      endpoint,
      sdkVersion: SDK_VERSION,
      frameworkVersion,
    });

    registered = true;
  } catch {
    // Telemetry setup must never break the host app.
  }
}
