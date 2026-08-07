import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["bullmq"],
  eslint: {
    // Linting runs as a dedicated, stricter monorepo check.
    ignoreDuringBuilds: true
  },
  transpilePackages: [
    "@rezaru/ai-compiler",
    "@rezaru/config",
    "@rezaru/connectors",
    "@rezaru/database",
    "@rezaru/execution-engine",
    "@rezaru/observability",
    "@rezaru/ui",
    "@rezaru/workflow-schema"
  ],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    }];
  }
};

export default nextConfig;
