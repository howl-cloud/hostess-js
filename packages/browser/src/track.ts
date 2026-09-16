/** Custom events (phase 2): typed no-op until ingest exists. Records nothing. */
export function track(
  _name: string,
  _props?: Record<string, string | number | boolean>,
): void {}
