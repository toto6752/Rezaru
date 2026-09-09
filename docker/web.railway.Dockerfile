# Web service image for Railway.
#
# This now bundles TWO processes in one container:
#   1. The Next.js app (@rezaru/web) - the only public entry point.
#   2. The AI-agent builder (services/agent-builder), a Python/FastAPI app
#      that used to be its own separate service/repo (rezaru-Jaha). Next.js
#      proxies a handful of paths to it internally (see next.config.ts
#      `rewrites`) so the whole product lives on one domain with one login.
#
# Debian (not Alpine) on purpose: the agent-builder's Python dependencies
# (grpcio, Pillow, cryptography, psycopg2, ...) ship manylinux/glibc wheels.
# Alpine's musl libc would force most of them to compile from source, which
# is slow and fragile. Single stage, same as before: the runtime keeps pnpm,
# the Prisma CLI and the generated query engine, so `preDeployCommand` can
# run migrations and the Prisma engine always matches the image it was
# generated in.
FROM node:22-bookworm-slim
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    python3 \
    python3-venv \
    python3-pip \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g corepack@latest \
  && corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate

# AI-agent builder (Python/FastAPI) dependencies, in their own venv so they
# never collide with anything Node/npm installs.
RUN python3 -m venv /opt/agent-builder-venv \
  && /opt/agent-builder-venv/bin/pip install --no-cache-dir -r services/agent-builder/requirements.txt
ENV AGENT_BUILDER_PYTHON=/opt/agent-builder-venv/bin/python3

# Public variables are inlined into the client bundle, so they must exist at
# build time. Railway passes service variables to the build as build args.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY

RUN pnpm --filter @rezaru/web build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
RUN chmod +x docker/start-web.sh
CMD ["docker/start-web.sh"]
