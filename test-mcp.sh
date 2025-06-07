#!/bin/bash

echo "Testing MCP server..."

# Start the MCP server in the background
cd /home/runner/work/trails/trails
timeout 5s node packages/trails-server/dist/index.js 2>/dev/null &
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