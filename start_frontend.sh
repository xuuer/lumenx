#!/bin/bash

echo "========================================"
echo "Starting Frontend (Next.js)..."
echo "macOS note: npm run dev now enables a stable watcher path automatically."
echo "Default frontend dev port: 3008"
echo "========================================"

cd frontend

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found. Installing dependencies..."
    npm install
    echo "✅ Dependencies installed."
fi

npm run dev
