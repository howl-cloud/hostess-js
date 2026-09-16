import type { Resource } from "@opentelemetry/resources";
import { MeterProvider, PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";

import { signalEndpoint } from "./otel";

// Dedicated MeterProvider; never disturb the app's own metrics setup.
let markerProvider: MeterProvider | undefined;

export interface MarkerOptions {
  resource: Resource;
  endpoint: string;
  sdkVersion: string;
  frameworkVersion: string;
  intervalMillis?: number;
}

/** Heartbeat gauge so the platform detects installed-but-idle apps. Idempotent. */
export function startMarkerHeartbeat(options: MarkerOptions): MeterProvider {
  if (markerProvider) return markerProvider;

  const reader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: signalEndpoint(options.endpoint, "metrics"),
    }),
    exportIntervalMillis: options.intervalMillis ?? 60_000,
  });

  const provider = new MeterProvider({
    resource: options.resource,
    readers: [reader],
  });

  const meter = provider.getMeter("@hostess/nextjs");
  const gauge = meter.createObservableGauge("hostess_instrumentation_info", {
    description: "Hostess instrumentation marker (1 = installed).",
  });
  gauge.addCallback((result) => {
    result.observe(1, {
      language: "js",
      framework: "nextjs",
      sdk_version: options.sdkVersion,
      framework_version: options.frameworkVersion,
    });
  });

  markerProvider = provider;
  return provider;
}
