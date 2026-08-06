import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "OutcomeOS — Automation without workflows",
    template: "%s · OutcomeOS"
  },
  description: "Describe the outcome. OutcomeOS builds, runs, fixes, and improves the automation.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "OutcomeOS — Automation without workflows",
    description: "Describe the outcome. AI builds the automation.",
    type: "website"
  },
  twitter: { card: "summary_large_image" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
