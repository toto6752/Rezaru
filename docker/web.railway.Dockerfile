# Web service image for Railway.
# Single stage on purpose: the runtime keeps pnpm, the Prisma CLI and the
# generated query engine, so `preDeployCommand` can run migrations and the
# Prisma engine always matches the image it was generated in.
FROM node:22-alpine
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN apk add --no-cache openssl libc6-compat \
  && npm install -g corepack@latest \
  && corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate

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
CMD ["pnpm", "--filter", "@rezaru/web", "start"]
