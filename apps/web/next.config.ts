import type { NextConfig } from "next";

const AGENT_BUILDER_INTERNAL_URL = process.env.AGENT_BUILDER_INTERNAL_URL ?? "http://127.0.0.1:8001";

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
  async rewrites() {
    // The AI-agent builder (Telegram/WhatsApp bots) is a separate Python
    // service running inside the same container. Proxying these paths keeps
    // everything on one domain with one login, without merging the codebases.
    const agentBuilderPaths = [
      "/dashboard",
      "/dashboard/:path*",
      "/agent",
      "/agent/:path*",
      "/api/agent/:path*",
      "/admin",
      "/admin/:path*",
      "/webhooks/:path*",
      "/gemini-test",
      "/static/:path*"
    ];
    return agentBuilderPaths.map((source) => ({
      source,
      destination: `${AGENT_BUILDER_INTERNAL_URL}${source}`
    }));
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
