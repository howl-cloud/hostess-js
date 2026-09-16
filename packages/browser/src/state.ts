import { BeaconQueue } from "./queue";

// Window singleton so inject/injectSpeedInsights share state across ESM+CJS duplicates.
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
