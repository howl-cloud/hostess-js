import { BeaconQueue } from "./queue";

// Per-page singleton, stashed on `window` so that `inject` and
// `injectSpeedInsights` share one queue and one set of idempotence flags even
// if they are pulled from separate module instances (ESM + CJS in the same
// bundle). This is the mechanism behind strict double-inject idempotence.
interface RumState {
  pv?: boolean;
  wv?: boolean;
  queue?: BeaconQueue;
}

const KEY = "__hostess_rum__";

export function state(): RumState {
  const w = window as unknown as Record<string, RumState | undefined>;
  return (w[KEY] ??= {});
}

export function getQueue(): BeaconQueue {
  const st = state();
  return (st.queue ??= new BeaconQueue());
}
