# @hostess/nextjs

Native Hostess insights for Next.js: server-side API insights plus client-side
**Audience Analytics** and **Speed Insights** — a couple of lines, no OTLP,
collector, or Prometheus configuration.

```bash
npm install @hostess/nextjs
```

## Client insights — `<Analytics />` and `<SpeedInsights />`

Add both to your root layout (App Router) or custom `App` (Pages Router):

```tsx
// app/layout.tsx
import { Analytics, SpeedInsights } from "@hostess/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

```tsx
// pages/_app.tsx (Pages Router)
import { Analytics, SpeedInsights } from "@hostess/nextjs";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

`<Analytics />` sends one page-view beacon per navigation; `<SpeedInsights />`
reports Core Web Vitals (LCP, CLS, INP, FCP, TTFB). Both:

- reconstruct the **route template** (`/blog/[slug]`, `/docs/[...path]`) from the
  concrete path — App Router via `usePathname()` + `useParams()`, Pages Router
  from `router.route`;
- detect the router at runtime, so the same components work in both;
- render nothing, mount their collector exactly once (Strict-Mode safe), and add
  nothing to the RSC payload;
- are cookieless and send no query strings or user identifiers (see the
  [`@hostess/browser`](../browser) privacy rules);
- work unchanged under `output: "export"` for static sites.

Both accept `debug?: boolean` to log would-be beacons to the console.

## Server instrumentation — `register` / `onRequestError`

The server half is a **separate entry** (`@hostess/nextjs/server`):

```ts
// instrumentation.ts
export { register, onRequestError } from "@hostess/nextjs/server";
```

For Next 13.4–14, also enable the hook (stable and automatic in Next 15+):

```js
// next.config.js
module.exports = { experimental: { instrumentationHook: true } };
```

### Why two entry points

The client components are a real `"use client"` module and the server code is
Node-only OpenTelemetry. These cannot share one import specifier: the Pages
Router's (non-RSC) bundler resolves a single package entry per build pass and
cannot reconcile a server module that re-exports `"use client"` components — its
exports come back empty (`"module has no exports"`). Splitting the entries keeps
each build clean: OTel never enters the browser bundle, and the components never
drag OTel into `instrumentation.ts`. The root is the components (the common,
copy-paste case); the server lives at `/server`.

### What `register()` does

- Registers a minimal OpenTelemetry `NodeTracerProvider` whose OTLP exporter
  points at the Hostess collector (endpoint injected by the platform).
- Relies on Next.js's **native** OTel spans — route templates, method, and
  status come from Next itself; it does not patch the server or wrap handlers.
- Installs the W3C propagators, so server-side `fetch` carries trace context to
  downstream services.
- Emits a marker heartbeat so Studio can tell "installed, waiting for traffic"
  from "not installed".

`onRequestError` records a **bounded** error event (route, method, error class,
digest — never messages, stacks, headers, or raw URLs). Idempotent; no-ops on
the edge runtime, when disabled (`HOSTESS_INSTRUMENTATION=false`), or when no
collector endpoint is available; fails silent.

## Privacy

Server insights collect HTTP method, route template, status, and duration;
errors carry only class name + digest. Client insights are cookieless with no
query strings, raw URLs, headers, tokens, or user identifiers — visitor
identity is derived server-side only.

## Examples

- [`examples/nextjs-app-router`](../../examples/nextjs-app-router)
- [`examples/nextjs-pages-router`](../../examples/nextjs-pages-router)

## Development

```bash
pnpm install
pnpm --filter @hostess/nextjs build
pnpm --filter @hostess/nextjs test
```
