# Changelog

All notable changes to `@hostess/nextjs` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-13

Initial release. Server-side Next.js integration for Hostess **API Insights**.

### Added

- `register` and `onRequestError`, for re-export from `instrumentation.ts`:

  ```ts
  export { register, onRequestError } from "@hostess/nextjs";
  ```

- `register()`:
  - Registers a minimal OpenTelemetry `NodeTracerProvider` whose OTLP exporter
    points at the platform-injected Hostess collector.
  - Relies on Next.js's native span emission — route templates, method, and
    status come from Next itself.
  - Installs the W3C propagators so server-side `fetch` carries trace context
    to downstream services (cross-service traces).
  - Reads the running Next.js version from `next/package.json` and emits a
    marker heartbeat (`hostess_instrumentation_info`) on a dedicated, non-global
    `MeterProvider`.
- `onRequestError()` — records a bounded error event (route, method, error class
  name, digest only; never messages, stacks, headers, or raw URLs).

### Behavior

- Idempotent; no-ops on the edge runtime, when disabled
  (`HOSTESS_INSTRUMENTATION=false`), or when no collector endpoint is available.
- Fails silent — never degrades the host app.

### Notes

- v0.1 is server-only. Client-side Audience & Speed Insights
  (`<Analytics />` / `<SpeedInsights />`) ship in a later release alongside the
  platform RUM ingest path.

[0.1.0]: https://github.com/howl-cloud/hostess-js/releases/tag/v0.1.0
