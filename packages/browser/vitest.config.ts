import { defineConfig } from "vitest/config";

// The core runs in the browser, so tests need a DOM (document, location,
// history, URL/URLSearchParams). jsdom gives the closest fidelity to a real
// user agent; transport primitives (navigator.sendBeacon, fetch) are stubbed
// per-test since jsdom does not implement them.
export default defineConfig({
  test: {
    environment: "jsdom",
  },
});
