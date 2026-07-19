import { describe, expect, it } from "vitest";

import { stripQuery } from "../src/route";
import { extractUtm } from "../src/utm";
import { referrerOrigin } from "../src/referrer";

describe("stripQuery", () => {
  it("removes query and hash, keeps the path", () => {
    expect(stripQuery("/blog/hello")).toBe("/blog/hello");
    expect(stripQuery("/blog/hello?utm_source=x")).toBe("/blog/hello");
    expect(stripQuery("/blog/hello#section")).toBe("/blog/hello");
    expect(stripQuery("/blog/hello?a=1#b")).toBe("/blog/hello");
    expect(stripQuery("/")).toBe("/");
  });
});

describe("extractUtm", () => {
  it("extracts only the five utm_* keys and drops everything else", () => {
    const utm = extractUtm(
      "?utm_source=hn&utm_medium=social&utm_campaign=launch&utm_term=paas&utm_content=hero&token=secret&id=42",
    );
    expect(utm).toEqual({
      source: "hn",
      medium: "social",
      campaign: "launch",
      term: "paas",
      content: "hero",
    });
    expect(utm).not.toHaveProperty("token");
    expect(utm).not.toHaveProperty("id");
  });

  it("returns an empty object when no utm params are present", () => {
    expect(extractUtm("?token=secret&ref=42")).toEqual({});
    expect(extractUtm("")).toEqual({});
  });

  it("omits blank utm values and truncates to 64 chars", () => {
    expect(extractUtm("?utm_source=")).toEqual({});
    const long = "a".repeat(200);
    expect(extractUtm(`?utm_campaign=${long}`).campaign).toHaveLength(64);
  });
});

describe("referrerOrigin", () => {
  it("reduces a cross-origin referrer to its origin only", () => {
    expect(referrerOrigin("https://news.ycombinator.com/item?id=123")).toBe(
      "https://news.ycombinator.com",
    );
  });

  it("returns '' for same-origin, direct, and non-http schemes", () => {
    // jsdom default origin is http://localhost:3000
    expect(referrerOrigin("http://localhost:3000/other")).toBe("");
    expect(referrerOrigin("")).toBe("");
    expect(referrerOrigin("android-app://com.example")).toBe("");
    expect(referrerOrigin("not a url")).toBe("");
  });

  it("never leaks the referrer path or query", () => {
    const origin = referrerOrigin("https://x.com/secret/path?q=leak");
    expect(origin).toBe("https://x.com");
    expect(origin).not.toContain("secret");
    expect(origin).not.toContain("leak");
  });
});
