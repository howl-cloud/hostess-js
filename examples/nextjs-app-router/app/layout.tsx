import type { ReactNode } from "react";
import { Analytics, SpeedInsights } from "@hostess/nextjs";

export const metadata = {
  title: "Hostess App Router Example",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* One line each in the root layout — that's the whole integration. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
