#!/bin/bash
# Launches both processes that make up the "web" service:
#   - the AI-agent builder (FastAPI), bound to localhost only - it is never
#     exposed directly, Next.js proxies to it (see next.config.ts rewrites).
#   - the Next.js app, bound to $PORT - the only public entry point.
#
# If either one dies, the whole container exits so Railway's restart policy
# brings both back up together instead of silently running with half the
# product broken.
set -uo pipefail

AGENT_BUILDER_PORT="${AGENT_BUILDER_PORT:-8001}"
AGENT_BUILDER_PYTHON="${AGENT_BUILDER_PYTHON:-/opt/agent-builder-venv/bin/python3}"

(
  cd /app/services/agent-builder
  exec "$AGENT_BUILDER_PYTHON" -m uvicorn main:app --host 127.0.0.1 --port "$AGENT_BUILDER_PORT"
) &
AGENT_BUILDER_PID=$!

pnpm --filter @rezaru/web start &
WEB_PID=$!

wait -n "$AGENT_BUILDER_PID" "$WEB_PID"
status=$?
echo "One of the processes exited (status $status) - stopping the container." >&2
kill "$AGENT_BUILDER_PID" "$WEB_PID" 2>/dev/null || true
exit "$status"
