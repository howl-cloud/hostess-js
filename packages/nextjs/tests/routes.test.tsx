import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { cleanup, render } from "@testing-library/react";
import type { InjectOptions, RouteInfo } from "@hostess/browser";

// Shared, mutable mock state. Defined via vi.hoisted so the (hoisted) vi.mock
// factories below can reference it without a TDZ error.
const mock = vi.hoisted(() => {
  const handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
  const events = {
    on(event: string, h: (...a: unknown[]) => void) {
      (handlers[event] ??= []).push(h);
    },
    off(event: string, h: (...a: unknown[]) => void) {
      handlers[event] = (handlers[event] ?? []).filter((x) => x !== h);
    },
    emit(event: string, ...args: unknown[]) {
      (handlers[event] ?? []).forEach((h) => h(...args));
    },
  };
  interface Rec {
    kind: "pv" | "wv";
    nav: "load" | "spa" | "back-forward";
    info: RouteInfo;
    sdk?: string;
  }
  return {
    navPathname: "/" as string | null,
    navParams: {} as Record<string, string | string[]> | null,
    pagesRouter: null as { route: string; asPath: string } | null,
    events,
    recorded: [] as Rec[],
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => mock.navPathname,
  useParams: () => mock.navParams,
}));

vi.mock("next/router", () => ({
  default: {
    get router() {
      return mock.pagesRouter;
    },
    events: mock.events,
  },
}));

// Faithful fake of the browser core: records what the adapter drives through
// the RouteProvider seam (current() + onChange), no transport or web-vitals.
vi.mock("@hostess/browser", () => {
  const injector = (kind: "pv" | "wv") => (opts: InjectOptions) => {
    mock.recorded.push({ kind, nav: "load", info: opts.routeProvider!.current(), sdk: opts.sdk });
    opts.routeProvider!.onChange((info, nav) => mock.recorded.push({ kind, nav, info }));
  };
  return { inject: injector("pv"), injectSpeedInsights: injector("wv") };
});

import { Analytics } from "../src/analytics";
import { SpeedInsights } from "../src/speed-insights";

beforeEach(() => {
  mock.recorded.length = 0;
  mock.navPathname = "/";
  mock.navParams = {};
  mock.pagesRouter = null;
});

afterEach(() => {
  cleanup();
});

describe("Analytics — App Router", () => {
  it("emits an initial pv with the reconstructed route template and sdk", () => {
    mock.navPathname = "/blog/hello-world";
    mock.navParams = { slug: "hello-world" };

    render(<Analytics />);

    expect(mock.recorded).toHaveLength(1);
    expect(mock.recorded[0]).toMatchObject({
      kind: "pv",
      nav: "load",
      sdk: "nextjs@0.2.0",
      info: { route: "/blog/[slug]", path: "/blog/hello-world" },
    });
  });

  it("emits one pv per SPA navigation (path change)", () => {
    mock.navPathname = "/blog/a";
    mock.navParams = { slug: "a" };
    const { rerender } = render(<Analytics />);

    mock.navPathname = "/blog/b";
    mock.navParams = { slug: "b" };
    rerender(<Analytics />);

    expect(mock.recorded.map((r) => [r.nav, r.info.route, r.info.path])).toEqual([
      ["load", "/blog/[slug]", "/blog/a"],
      ["spa", "/blog/[slug]", "/blog/b"],
    ]);
  });

  it("does NOT double-count when only search params change (same path)", () => {
    mock.navPathname = "/search";
    mock.navParams = {};
    const { rerender } = render(<Analytics />);

    // A search-param-only navigation does not change usePathname(); re-rendering
    // with the same pathname must not produce a second pv.
    rerender(<Analytics />);
    rerender(<Analytics />);

    expect(mock.recorded).toHaveLength(1);
    expect(mock.recorded[0].nav).toBe("load");
  });

  it("is idempotent under StrictMode double-mount", () => {
    mock.navPathname = "/";
    render(
      <StrictMode>
        <Analytics />
      </StrictMode>,
    );

    expect(mock.recorded.filter((r) => r.nav === "load")).toHaveLength(1);
  });
});

describe("Analytics — Pages Router", () => {
  it("uses router.route as the template and fires on routeChangeComplete", () => {
    mock.navPathname = null; // App Router hooks null -> Pages Router branch
    mock.navParams = null;
    mock.pagesRouter = { route: "/blog/[slug]", asPath: "/blog/hello?ref=x" };

    render(<Analytics />);

    expect(mock.recorded).toHaveLength(1);
    expect(mock.recorded[0]).toMatchObject({
      kind: "pv",
      nav: "load",
      info: { route: "/blog/[slug]", path: "/blog/hello" },
    });

    mock.pagesRouter = { route: "/about", asPath: "/about" };
    mock.events.emit("routeChangeComplete", "/about");

    expect(mock.recorded).toHaveLength(2);
    expect(mock.recorded[1]).toMatchObject({
      nav: "spa",
      info: { route: "/about", path: "/about" },
    });
  });
});

describe("SpeedInsights", () => {
  it("wires the same route reconstruction for web vitals", () => {
    mock.navPathname = "/docs/a/b";
    mock.navParams = { path: ["a", "b"] };

    render(<SpeedInsights />);

    expect(mock.recorded).toHaveLength(1);
    expect(mock.recorded[0]).toMatchObject({
      kind: "wv",
      nav: "load",
      sdk: "nextjs@0.2.0",
      info: { route: "/docs/[...path]", path: "/docs/a/b" },
    });
  });
});
