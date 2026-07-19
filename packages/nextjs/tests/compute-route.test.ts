import { describe, expect, it } from "vitest";

import { computeRoute, stripQuery } from "../src/compute-route";

describe("computeRoute", () => {
  it("reconstructs a single dynamic segment", () => {
    expect(computeRoute("/blog/hello-world", { slug: "hello-world" })).toBe("/blog/[slug]");
  });

  it("reconstructs multiple dynamic segments", () => {
    expect(
      computeRoute("/shop/shoes/nike-air", { category: "shoes", product: "nike-air" }),
    ).toBe("/shop/[category]/[product]");
  });

  it("reconstructs a catch-all segment", () => {
    expect(computeRoute("/docs/a/b/c", { path: ["a", "b", "c"] })).toBe("/docs/[...path]");
  });

  it("reconstructs an optional catch-all with segments", () => {
    // useParams() gives an array for both required and optional catch-alls, so
    // both render as [...all] (documented limitation, matches @vercel/analytics).
    expect(computeRoute("/a/b", { all: ["a", "b"] })).toBe("/[...all]");
  });

  it("leaves an empty optional catch-all (root) untouched", () => {
    expect(computeRoute("/", {})).toBe("/");
    expect(computeRoute("/", { all: [] })).toBe("/");
  });

  it("mixes static, dynamic, and catch-all segments", () => {
    expect(
      computeRoute("/users/42/posts/x/y", { id: "42", rest: ["x", "y"] }),
    ).toBe("/users/[id]/posts/[...rest]");
  });

  it("handles URL-encoded param values (space)", () => {
    // usePathname() is encoded; useParams() is decoded.
    expect(computeRoute("/blog/hello%20world", { slug: "hello world" })).toBe("/blog/[slug]");
  });

  it("handles catch-all values with an encoded segment", () => {
    expect(computeRoute("/docs/a/b%20c", { path: ["a", "b c"] })).toBe("/docs/[...path]");
  });

  it("does not replace a value that only matches mid-segment", () => {
    // "he" must not clip "hello" — the anchor requires a segment boundary.
    expect(computeRoute("/blog/hello", { x: "he" })).toBe("/blog/hello");
  });

  it("returns the pathname unchanged when there are no params", () => {
    expect(computeRoute("/about", {})).toBe("/about");
  });

  it("passes null/empty pathname straight through", () => {
    expect(computeRoute(null, { slug: "x" })).toBeNull();
    expect(computeRoute("", { slug: "x" })).toBe("");
  });

  it("is resilient to a value with regex metacharacters", () => {
    expect(computeRoute("/files/a.b+c", { name: "a.b+c" })).toBe("/files/[name]");
  });
});

describe("stripQuery", () => {
  it("removes query and hash", () => {
    expect(stripQuery("/p?a=1")).toBe("/p");
    expect(stripQuery("/p#x")).toBe("/p");
    expect(stripQuery("/p?a=1#x")).toBe("/p");
    expect(stripQuery("/p")).toBe("/p");
  });

  it("never returns an empty string", () => {
    expect(stripQuery("?a=1")).toBe("/");
  });
});
