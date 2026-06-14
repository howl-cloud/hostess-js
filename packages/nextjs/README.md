# @hostess/nextjs

Native Hostess insights for Next.js. One line in `instrumentation.ts` and
Studio shows route-level traffic, latency, status codes, and error rates — no
OTLP, collector, or Prometheus configuration.

```bash
npm install @hostess/nextjs
```

```ts
// instrumentation.ts
export { register, onRequestError } from "@hostess/nextjs";
```

For Next 13.4–14, also enable the hook:

```js
// next.config.js
module.exports = { experimental: { instrumentationHook: true } };
```

(Stable and automatic in Next 15+.)

## What `register()` does

- Registers a minimal OpenTelemetry `NodeTracerProvider` whose OTLP exporter
  points at the Hostess collector (endpoint injected by the platform).
- Relies on Next.js's **native** OTel spans — route templates (`/blog/[slug]`),
  method, and status come from Next itself. It does not patch the server or wrap
  your handlers.
- Installs the W3C propagators, so server-side `fetch` carries trace context to
  downstream services (cross-service traces).
- Reads the running Next.js version from `next/package.json` and emits a marker
  heartbeat so Studio can tell "installed, waiting for traffic" from "not
  installed".

`onRequestError` records a **bounded** error event (route, method, error class,
digest — never messages, stacks, headers, or raw URLs).

Idempotent; no-ops on the edge runtime, when disabled
(`HOSTESS_INSTRUMENTATION=false`), or when no collector endpoint is available;
fails silent so it never degrades the app.

## Privacy

Server insights collect HTTP method, route template, status, and duration.
Errors carry only class name + digest. No bodies, query strings, raw URLs,
headers, cookies, tokens, or user identifiers.

## Roadmap

- **v0.1 (this release):** server instrumentation (`register`, `onRequestError`)
  + marker heartbeat.
- **Next:** client-side **Audience** and **Speed Insights** —
  `<Analytics />` and `<SpeedInsights />` for the root layout (page views,
  cookieless visitors, and per-route Core Web Vitals). Depends on the platform
  RUM ingest path.

## Development

```bash
pnpm install
pnpm --filter @hostess/nextjs build
pnpm --filter @hostess/nextjs test
```
