#!/usr/bin/env sh
set -eu

pnpm typecheck
pnpm lint
pnpm test
pnpm build
