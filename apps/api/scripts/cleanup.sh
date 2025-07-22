#!/bin/bash

# CronX API Cleanup Script
# Kills any lingering Node.js processes related to the API server

echo "🧹 Cleaning up lingering processes..."

# Find and kill ts-node processes running server.ts
TS_NODE_PIDS=$(pgrep -f "ts-node.*server\.ts")
if [ ! -z "$TS_NODE_PIDS" ]; then
    echo "Found ts-node processes: $TS_NODE_PIDS"
    kill -TERM $TS_NODE_PIDS 2>/dev/null
    sleep 2
    # Force kill if still running
    kill -KILL $TS_NODE_PIDS 2>/dev/null
    echo "✅ Killed ts-node processes"
else
    echo "No ts-node processes found"
fi

# Find and kill compiled Node.js processes
NODE_PIDS=$(pgrep -f "node.*dist/server\.js")
if [ ! -z "$NODE_PIDS" ]; then
    echo "Found node processes: $NODE_PIDS"
    kill -TERM $NODE_PIDS 2>/dev/null
    sleep 2
    # Force kill if still running
    kill -KILL $NODE_PIDS 2>/dev/null
    echo "✅ Killed node processes"
else
    echo "No compiled node processes found"
fi

# Find and kill nodemon processes
NODEMON_PIDS=$(pgrep -f "nodemon")
if [ ! -z "$NODEMON_PIDS" ]; then
    echo "Found nodemon processes: $NODEMON_PIDS"
    kill -TERM $NODEMON_PIDS 2>/dev/null
    sleep 1
    kill -KILL $NODEMON_PIDS 2>/dev/null
    echo "✅ Killed nodemon processes"
else
    echo "No nodemon processes found"
fi

# Check for processes using port 3001
PORT_PIDS=$(lsof -ti:3001 2>/dev/null)
if [ ! -z "$PORT_PIDS" ]; then
    echo "Found processes using port 3001: $PORT_PIDS"
    kill -TERM $PORT_PIDS 2>/dev/null
    sleep 2
    kill -KILL $PORT_PIDS 2>/dev/null
    echo "✅ Killed processes on port 3001"
else
    echo "No processes found on port 3001"
fi

echo "🎉 Cleanup completed!"
