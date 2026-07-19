# @hostess/browser

Framework-agnostic browser core for Hostess **Audience Analytics** and **Speed
Insights**. Page views and Core Web Vitals from any site behind a Hostess URL —
cookieless, no consent banner, ~1.7 KB gzipped for analytics.

```bash
npm install @hostess/browser
```

```ts
import { inject, injectSpeedInsights } from "@hostess/browser";

inject(); // page views
injectSpeedInsights(); // LCP, CLS, INP, FCP, TTFB
```

This is the shared core that framework adapters build on — `@hostess/nextjs`
re-exports `<Analytics />` and `<SpeedInsights />` on top of it. Use it directly
in any SPA, or (later) via a `<script>` tag on static sites.

## API

```ts
inject(opts?);              // one pv beacon per page view (load + SPA navigations)
injectSpeedInsights(opts?); // wv beacons from the web-vitals attribution build
track(name, props?);        // custom events — phase 2, currently a no-op stub

type RouteInfo = { route: string; path: string };
type RouteProvider = {
  current(): RouteInfo;
  onChange(cb: (info: RouteInfo, nav: "spa" | "back-forward") => void): () => void;
};

// opts: { routeProvider?: RouteProvider; debug?: boolean }
```

Both entry points are **idempotent** and safe to call during SSR (they no-op
without a DOM). The only framework-specific concern is route-template
reconstruction, expressed through `RouteProvider`; the default provider uses
`location.pathname` as both `route` and `path` and tracks SPA navigations via
`history`/`popstate`.

## What it sends

Same-origin `POST /_hostess/rum` — a JSON array of beacons (≤ 20, ≤ 8 KB per
request) via `navigator.sendBeacon`, falling back to `fetch(keepalive)`. Flushed
when the page is hidden (where CLS and INP finalize) and at queue thresholds.

Each beacon (schema v1):

| Field | Meaning |
| --- | --- |
| `v` | schema version (`1`) |
| `k` | `pv` (page view) or `wv` (web vital) |
| `route` / `path` | route template and concrete path (query stripped) |
| `ref` | referrer **origin only**, `""` for same-origin/direct |
| `utm` | the five `utm_*` params only |
| `nav` | `load` / `spa` / `back-forward` |
| `dc` | coarse device class (`desktop` / `mobile` / `tablet`) |
| `sdk` | `browser@<version>` (adapters override) |

`wv` beacons add `m` (metric name), `val` (ms; CLS unitless), and `rating`.
Everything else — visitor identity, country, browser/OS, hostname — is derived
**server-side** and never sent by the client.

## Privacy

Hard lines enforced in code and asserted in tests:

- **No cookies, no `localStorage`, no fingerprinting.**
- **No query strings** and no raw URLs with parameter values — only the five
  `utm_*` keys cross the wire, and referrers are reduced to their origin.
- **No user identifiers.** Visitor uniqueness is derived server-side from a
  daily-rotating salt (the Plausible model).

`NODE_ENV=development` sends **nothing**. `debug: true` logs the would-be
payloads to the console (in any environment).

## Failure posture

Beacons are fire-and-forget. If the ingest endpoint is missing or disabled
(`insights.browser: disabled` → 404), the queue detects it on the first
observable request and **stops for the rest of the page's lifetime** — silent
and free after the first failure.

## Bundle

Tree-shakeable, `sideEffects: false`, ESM + CJS via bunchee. Importing only
`inject` pulls ~1.7 KB gzipped; `injectSpeedInsights` adds the `web-vitals`
attribution build (~6 KB gzipped total).

## Development

```bash
pnpm install
pnpm --filter @hostess/browser build
pnpm --filter @hostess/browser test
```
