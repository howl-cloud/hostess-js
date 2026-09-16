import { SpanStatusCode, trace } from "@opentelemetry/api";

import { SDK_VERSION } from "./version";

// Local shapes avoid a hard type dependency on a specific Next version.
interface RequestInfo {
  method?: string;
}

interface ErrorContext {
  routePath?: string;
  renderSource?: string;
  routeType?: string;
}

/**
 * onRequestError hook (Next ≥ 15). Records only route, method, error class,
 * and digest — never messages, stacks, or bodies. Fails silent.
 */
export function onRequestError(
  error: unknown,
  request: RequestInfo,
  context: ErrorContext,
): void {
  try {
    const tracer = trace.getTracer("@hostess/nextjs", SDK_VERSION);
    const span = tracer.startSpan("hostess.request_error");

    span.setAttribute("hostess.error.class", errorClassName(error));
    const digest = errorDigest(error);
    if (digest) span.setAttribute("hostess.error.digest", digest);
    if (request?.method) span.setAttribute("http.request.method", request.method);
    if (context?.routePath) span.setAttribute("http.route", context.routePath);
    if (context?.renderSource) {
      span.setAttribute("hostess.render_context", context.renderSource);
    } else if (context?.routeType) {
      span.setAttribute("hostess.render_context", context.routeType);
    }

    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();
  } catch {
    // The error hook must never throw.
  }
}

function errorClassName(error: unknown): string {
  if (error && typeof error === "object" && error.constructor?.name) {
    return error.constructor.name;
  }
  return "Error";
}

function errorDigest(error: unknown): string | undefined {
  if (error && typeof error === "object" && "digest" in error) {
    const digest = (error as { digest?: unknown }).digest;
    if (typeof digest === "string") return digest;
  }
  return undefined;
}
