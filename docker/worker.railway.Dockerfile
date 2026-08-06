# Durable execution worker image for Railway.
FROM node:22-alpine
WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN apk add --no-cache openssl libc6-compat \
  && npm install -g corepack@latest \
  && corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate

ENV NODE_ENV=production
ENV WORKER_HEALTH_PORT=3001
EXPOSE 3001
CMD ["pnpm", "--filter", "@outcomeos/worker", "start"]
