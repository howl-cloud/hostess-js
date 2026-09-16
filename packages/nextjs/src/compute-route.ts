// Reconstruct the route template by substituting useParams() values out of
// usePathname() (Next exposes no client template). Values match in several
// encodings and only at segment boundaries.

export type RouteParams = Record<string, string | string[] | undefined>;

export function computeRoute(pathname: string | null, params: RouteParams | null): string | null {
  if (!pathname) return pathname;
  if (!params) return pathname;

  let result = pathname;
  try {
    const entries = Object.entries(params);

    // Single-value segments first, so catch-alls match last.
    for (const [key, value] of entries) {
      if (value == null || Array.isArray(value)) continue;
      result = substitute(result, value, `[${key}]`);
    }

    // Catch-alls: useParams() can't distinguish [...x] from [[...x]], so both
    // reconstruct as [...x]. Empty optionals leave the path untouched.
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

// Match decoded values against the encoded pathname; encodeURI preserves / in catch-alls.
function encodings(value: string): Set<string> {
  const set = new Set<string>([value]);
  try {
    set.add(encodeURI(value));
  } catch {}
  try {
    set.add(encodeURIComponent(value));
  } catch {}
  if (value.includes("/")) {
    try {
      set.add(value.split("/").map(encodeURIComponent).join("/"));
    } catch {}
  }
  return set;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripQuery(pathOrUrl: string): string {
  let end = pathOrUrl.length;
  const q = pathOrUrl.indexOf("?");
  const h = pathOrUrl.indexOf("#");
  if (q >= 0) end = Math.min(end, q);
  if (h >= 0) end = Math.min(end, h);
  return pathOrUrl.slice(0, end) || "/";
}
