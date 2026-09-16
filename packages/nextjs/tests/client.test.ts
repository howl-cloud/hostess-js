import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InjectOptions, RouteInfo } from "@hostess/browser";

const mock = vi.hoisted(() => {
  const handlers: Record<string, Array<(...a: unknown[]) => void>> = {};
  const readyCallbacks: Array<() => void> = [];
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
    debug?: boolean;
  }
  return {
    pagesRouter: null as { route: string; asPath: string } | null,
    readyCallbacks,
    events,
    recorded: [] as Rec[],
    initializePagesRouter(router: { route: string; asPath: string }) {
      this.pagesRouter = router;
      readyCallbacks.splice(0).forEach((callback) => callback());
    },
  };
});

vi.mock("next/router", () => ({
  default: {
    get router() {
      return mock.pagesRouter;
    },
    ready(callback: () => void) {
      if (mock.pagesRouter) callback();
      else mock.readyCallbacks.push(callback);
    },
    events: mock.events,
  },
}));

vi.mock("@hostess/browser", async () => {
  const { defaultRouteProvider } = await vi.importActual<typeof import("@hostess/browser")>(
    "@hostess/browser",
  );
  const injector = (kind: "pv" | "wv") => (opts: InjectOptions) => {
    const provider = opts.routeProvider ?? defaultRouteProvider();
    mock.recorded.push({
      kind,
      nav: "load",
      info: provider.current(),
      sdk: opts.sdk,
      debug: opts.debug,
    });
    provider.onChange((info, nav) => mock.recorded.push({ kind, nav, info }));
  };
  return {
    inject: injector("pv"),
    injectSpeedInsights: injector("wv"),
    defaultRouteProvider,
  };
});

beforeEach(() => {
  mock.recorded.length = 0;
  mock.pagesRouter = null;
  mock.readyCallbacks.length = 0;
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (typeof document !== "undefined") {
    document.getElementById("__NEXT_DATA__")?.remove();
  }
});

function markPagesDocument() {
  const el = document.createElement("script");
  el.id = "__NEXT_DATA__";
  document.body.appendChild(el);
}

describe("registerClient", () => {
  it("is a no-op without a DOM", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const { registerClient } = await import("../src/client");
    registerClient();
    expect(mock.recorded).toHaveLength(0);
  });

  it("uses location.pathname for App Router and tags nextjs@version", async () => {
    mock.pagesRouter = null;
    const { registerClient } = await import("../src/client");
    registerClient();

    const pvs = mock.recorded.filter((r) => r.kind === "pv");
    const wvs = mock.recorded.filter((r) => r.kind === "wv");
    expect(pvs).toHaveLength(1);
    expect(wvs).toHaveLength(1);
    expect(pvs[0]).toMatchObject({
      nav: "load",
      sdk: "nextjs@0.3.0",
      info: { route: "/", path: "/" },
    });
    expect(wvs[0].sdk).toBe("nextjs@0.3.0");
  });

  it("uses router.route for the first Pages Router pageview", async () => {
    mock.pagesRouter = { route: "/blog/[slug]", asPath: "/blog/hello?ref=x" };
    const { registerClient } = await import("../src/client");
    registerClient();

    expect(mock.recorded[0]).toMatchObject({
      kind: "pv",
      nav: "load",
      info: { route: "/blog/[slug]", path: "/blog/hello" },
    });
  });

  it("waits for Pages Router ready so the first pageview is the template", async () => {
    markPagesDocument();
    const { registerClient } = await import("../src/client");
    registerClient();
    expect(mock.recorded).toHaveLength(0);

    mock.initializePagesRouter({ route: "/blog/[slug]", asPath: "/blog/hello?ref=x" });

    expect(mock.recorded[0]).toMatchObject({
      kind: "pv",
      nav: "load",
      info: { route: "/blog/[slug]", path: "/blog/hello" },
    });
  });

  it("honors debug and is idempotent", async () => {
    const { registerClient } = await import("../src/client");
    registerClient({ debug: true });
    registerClient({ debug: true });

    expect(mock.recorded.filter((r) => r.kind === "pv")).toHaveLength(1);
    expect(mock.recorded[0].debug).toBe(true);
  });
});
