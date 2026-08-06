FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
ENV NODE_ENV=production
EXPOSE 3001
CMD ["pnpm", "--filter", "@outcomeos/worker", "start"]
