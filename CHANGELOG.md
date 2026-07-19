# Changelog

All notable changes to `@hostess/nextjs` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-18

### Added

- Client-side **Audience Analytics** and **Speed Insights**: `<Analytics />` and
  `<SpeedInsights />`, thin Next.js adapters over
  [`@hostess/browser`](packages/browser). Add them to the root layout
  (App Router) or custom `App` (Pages Router):

  ```tsx
  import { Analytics, SpeedInsights } from "@hostess/nextjs";
  // <Analytics /> <SpeedInsights />
  ```

  - App Router route-template reconstruction from `usePathname()` + `useParams()`
    (catch-all, optional catch-all, and URL-encoded/slash-containing values);
    Pages Router templates from `router.route`.
  - Runtime router detection — the same components work in both routers.
  - Mount their collector exactly once (Strict-Mode/remount safe); search-param
    changes do not double-count page views; nothing is added to the RSC payload.
  - Work unchanged under `output: "export"` (static sites).
- Example apps: `examples/nextjs-app-router` and `examples/nextjs-pages-router`.

### Changed

- **Breaking:** server instrumentation moves to a dedicated entry,
  `@hostess/nextjs/server`:

  ```ts
  // instrumentation.ts
  export { register, onRequestError } from "@hostess/nextjs/server";
  ```

  The root import (`@hostess/nextjs`) is now the client components. A single
  combined entry is not possible: the Pages Router bundler cannot resolve a
  server module that re-exports `"use client"` components. Splitting the entries
  keeps OTel out of the browser bundle and client code out of `instrumentation.ts`.

## [0.1.1] - 2026-06-14

### Added

- `homepage` (https://hostess.sh) and `bugs` links in the package manifest, so
  they surface on the npm package page.

### Changed

- Publish to npm via **OIDC trusted publishing** instead of a stored npm token —
  no `NPM_TOKEN` secret, and provenance remains automatic.

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

[0.1.1]: https://github.com/howl-cloud/hostess-js/releases/tag/v0.1.1
[0.1.0]: https://github.com/howl-cloud/hostess-js/releases/tag/v0.1.0
