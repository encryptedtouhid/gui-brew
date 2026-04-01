#!/bin/sh

# GuiBrew - Native Homebrew GUI
# Installs required libraries, clears any conflicting port, then launches the app

cd "$(dirname "$0")"

# --- Check for Node.js ---
if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed. Install it from https://nodejs.org or via 'brew install node'"
  exit 1
fi

# --- Check for npm ---
if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not found. It ships with Node.js — reinstall Node."
  exit 1
fi

# --- Check for Homebrew (required by the app) ---
if ! command -v brew >/dev/null 2>&1; then
  echo "Error: Homebrew is not installed. Install it from https://brew.sh"
  exit 1
fi

# --- Install npm dependencies ---
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# --- Clear port 3000 if in use (common Electron dev port) ---
PORT=3000
PID=$(lsof -ti :"$PORT" 2>/dev/null)
if [ -n "$PID" ]; then
  echo "Port $PORT is in use (PID $PID). Killing process..."
  kill -9 $PID 2>/dev/null
  echo "Port $PORT cleared."
fi

# --- Launch GuiBrew ---
echo "Starting GuiBrew..."
npm start
