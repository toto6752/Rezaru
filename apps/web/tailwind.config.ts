import type { Config } from "tailwindcss";

export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Point at the CSS custom properties so Tailwind utilities follow the
      // active theme instead of freezing one palette.
      colors: {
        ink: "var(--ink)",
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        line: "var(--line)",
        accent: "var(--accent)"
      },
      fontFamily: {
        sans: ["var(--font-body-sans)", "sans-serif"],
        display: ["var(--font-display-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"]
      },
      borderRadius: { DEFAULT: "var(--radius-sm)", xl: "var(--radius)" }
    }
  },
  plugins: []
} satisfies Config;
