import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#191a17",
        canvas: "#f7f6f1",
        accent: "#5b5ce2"
      },
      fontFamily: { sans: ["var(--font-geist-sans)", "sans-serif"], mono: ["var(--font-geist-mono)", "monospace"] }
    }
  },
  plugins: []
} satisfies Config;
