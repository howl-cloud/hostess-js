// App Router route-template reconstruction: substitute concrete `useParams()`
// values back out of `usePathname()` to recover the template
// (`/blog/hello-world` + `{ slug: "hello-world" }` → `/blog/[slug]`). This is
// the technique `@vercel/analytics` uses; Next does not expose the matched
// template to the client, so we reverse it from the params.
//
// `usePathname()` returns the URL-encoded path while `useParams()` returns
// decoded values, so each value is matched in several encodings. A value is
// only replaced when it aligns to a segment boundary (anchored with a following
// `/`, `?`, `#`, or end-of-string) so a param value can't match mid-segment.

export type RouteParams = Record<string, string | string[] | undefined>;

export function computeRoute(pathname: string | null, params: RouteParams | null): string | null {
  if (!pathname) return pathname;
  if (!params) return pathname;

  let result = pathname;
  try {
    const entries = Object.entries(params);

    // Single-value dynamic segments first (`[slug]`), so their values are
    // consumed before catch-all matching runs.
    for (const [key, value] of entries) {
      if (value == null || Array.isArray(value)) continue;
      result = substitute(result, value, `[${key}]`);
    }

    // Catch-all / optional catch-all segments (`[...slug]` / `[[...slug]]`).
    // `useParams()` returns an array for both and carries no optional/required
    // distinction, so both reconstruct as `[...key]` (matching @vercel/analytics
    // — an accepted, documented limitation). Empty optional catch-alls leave
    // the path untouched (e.g. `/` for `/[[...all]]` at the root).
    for (const [key, value] of entries) {
      if (!Array.isArray(value) || value.length === 0) continue;
      result = substitute(result, value.join("/"), `[...${key}]`);
    }

    return result;
  } catch {
    return pathname;
  }
}

function substitute(path: string, rawValue: string, replacement: string): string {
  for (const candidate of encodings(rawValue)) {
    if (!candidate) continue;
    const matcher = new RegExp(`/${escapeRegExp(candidate)}(?=[/?#]|$)`);
    if (matcher.test(path)) {
      return path.replace(matcher, `/${replacement}`);
    }
  }
  return path;
}

// A decoded param value must be matched against the encoded pathname, so try the
// raw value and its encoded forms. For catch-all values (containing `/`),
// `encodeURI` preserves the separators while encoding the segments.
function encodings(value: string): Set<string> {
  const set = new Set<string>([value]);
  try {
    set.add(encodeURI(value));
  } catch {
    // malformed input — skip this encoding.
  }
  try {
    set.add(encodeURIComponent(value));
  } catch {
    // skip
  }
  if (value.includes("/")) {
    try {
      set.add(value.split("/").map(encodeURIComponent).join("/"));
    } catch {
      // skip
    }
  }
  return set;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Drop the query string and hash from a Pages Router `asPath`. */
export function stripQuery(pathOrUrl: string): string {
  let end = pathOrUrl.length;
  const q = pathOrUrl.indexOf("?");
  const h = pathOrUrl.indexOf("#");
  if (q >= 0) end = Math.min(end, q);
  if (h >= 0) end = Math.min(end, h);
  return pathOrUrl.slice(0, end) || "/";
}
