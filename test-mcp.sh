#!/bin/bash

echo "Testing MCP server..."

# Start the MCP server in the background
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
cd "${repo_root:-$(dirname "$0")/..}" || {
  echo "❌ Unable to locate repository root"; exit 1;
}
timeout 5s node packages/logbooks-mcp/dist/index.js 2>/dev/null &
SERVER_PID=$!

# Give it a moment to start
sleep 1

# Test if it responds (basic check)
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ MCP server started successfully"
    kill $SERVER_PID 2>/dev/null
    exit 0
else
    echo "❌ MCP server failed to start"
    exit 1
fi