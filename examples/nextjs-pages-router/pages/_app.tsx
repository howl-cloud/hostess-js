import type { AppProps } from "next/app";
import { Analytics, SpeedInsights } from "@hostess/nextjs";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      {/* Same components as App Router — they detect the Pages Router at runtime. */}
      <Analytics />
      <SpeedInsights />
    </>
  );
}
