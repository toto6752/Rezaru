import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { GeistMono } from "geist/font";
import "@xyflow/react/dist/style.css";
import "./globals.css";
import { Providers } from "@/components/providers";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body-sans",
  display: "swap"
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-display-sans",
  display: "swap"
});

// Runs before paint so a light-theme user never sees a dark flash (and back).
// Mirrors the landing: saved choice wins, otherwise follow the OS.
const themeBootstrap = `(function(){try{var t=localStorage.getItem('rezaru-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}})();`;

export const metadata: Metadata = {
  title: {
    default: "Rezaru — Automation without workflows",
    template: "%s · Rezaru"
  },
  description: "Describe the outcome. Rezaru builds, runs, fixes, and improves the automation.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Rezaru — Automation without workflows",
    description: "Describe the outcome. AI builds the automation.",
    type: "website"
  },
  twitter: { card: "summary_large_image" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning className={`${manrope.variable} ${unbounded.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
