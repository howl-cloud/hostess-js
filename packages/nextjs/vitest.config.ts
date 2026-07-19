import { defineConfig } from "vitest/config";

// jsdom for the client-component tests (render, navigation events); the
// server-side otel tests are DOM-agnostic and pass under it too. `jsx:
// "automatic"` lets esbuild transform the `.tsx` components without a Babel/plugin
// step.
export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
  },
});
