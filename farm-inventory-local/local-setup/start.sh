#!/bin/bash

echo "=== Farm Inventory App Local Setup ==="
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "First run detected. Installing dependencies..."
  npm install
  if [ $? -ne 0 ]; then
    echo "Failed to install dependencies"
    exit 1
  fi
fi

echo "Starting the server..."
echo "The app will try to connect to the remote database"
echo "If that fails, it will fall back to in-memory storage"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node local-setup/server.js