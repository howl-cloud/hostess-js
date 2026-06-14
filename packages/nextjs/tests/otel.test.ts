import { afterEach, describe, expect, it } from "vitest";

import { isEnabled, isNodeRuntime, resolveEndpoint, signalEndpoint } from "../src/otel";
import { onRequestError } from "../src/on-request-error";
import { register } from "../src/register";

const ENV_KEYS = [
  "HOSTESS_INSTRUMENTATION",
  "HOSTESS_OTEL_ENDPOINT",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "NEXT_RUNTIME",
];

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe("isEnabled", () => {
  it("defaults on, off only for explicit falsey values", () => {
    expect(isEnabled()).toBe(true);
    process.env.HOSTESS_INSTRUMENTATION = "false";
    expect(isEnabled()).toBe(false);
    process.env.HOSTESS_INSTRUMENTATION = "off";
    expect(isEnabled()).toBe(false);
    process.env.HOSTESS_INSTRUMENTATION = "true";
    expect(isEnabled()).toBe(true);
  });
});

describe("resolveEndpoint", () => {
  it("prefers HOSTESS_OTEL_ENDPOINT over the generic OTLP var", () => {
    expect(resolveEndpoint()).toBeUndefined();
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://otel:4318";
    expect(resolveEndpoint()).toBe("http://otel:4318");
    process.env.HOSTESS_OTEL_ENDPOINT = "http://hostess-otel:4318";
    expect(resolveEndpoint()).toBe("http://hostess-otel:4318");
  });
});

describe("signalEndpoint", () => {
  it("appends the signal path idempotently", () => {
    expect(signalEndpoint("http://h:4318", "traces")).toBe("http://h:4318/v1/traces");
    expect(signalEndpoint("http://h:4318/", "metrics")).toBe("http://h:4318/v1/metrics");
    expect(signalEndpoint("http://h:4318/v1/traces", "traces")).toBe(
      "http://h:4318/v1/traces",
    );
  });
});

describe("isNodeRuntime", () => {
  it("is true by default and false on the edge runtime", () => {
    expect(isNodeRuntime()).toBe(true);
    process.env.NEXT_RUNTIME = "edge";
    expect(isNodeRuntime()).toBe(false);
  });
});

describe("register", () => {
  it("is a clean no-op without an endpoint", () => {
    expect(() => register()).not.toThrow();
  });

  it("no-ops on the edge runtime", () => {
    process.env.NEXT_RUNTIME = "edge";
    process.env.HOSTESS_OTEL_ENDPOINT = "http://hostess-otel:4318";
    expect(() => register()).not.toThrow();
  });
});

describe("onRequestError", () => {
  it("never throws and records only bounded fields", () => {
    class CustomError extends Error {
      digest = "abc123";
    }
    expect(() =>
      onRequestError(new CustomError("secret message"), { method: "GET" }, {
        routePath: "/products/[id]",
        renderSource: "react-server-components",
      }),
    ).not.toThrow();
  });
});
