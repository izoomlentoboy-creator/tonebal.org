#!/bin/bash
# deploy.sh — Deploy script for tonebal.org VPS
# Handles node_modules git conflicts after they were removed from tracking.
#
# Usage: bash deploy.sh
# Run from the project root on the VPS: /var/www/tonebal.org

set -e

echo "=== ToneBalance Deploy ==="

# 1. Clean up node_modules from git index to avoid conflicts
# This is needed because node_modules was previously tracked in git
# and then removed — causing "would be overwritten by merge" errors.
echo "[1/6] Cleaning up git state..."
git rm -r --cached node_modules 2>/dev/null || true
git checkout -- . 2>/dev/null || true

# 2. Pull latest code from main
echo "[2/6] Pulling latest code..."
git pull origin main

# 3. Install dependencies
echo "[3/6] Installing dependencies..."
pnpm install

# 4. Push database schema (adds new columns/tables for email auth)
echo "[4/6] Pushing database schema..."
pnpm db:push

# 5. Build the project
echo "[5/6] Building..."
pnpm build

# 6. Restart the application
echo "[6/6] Restarting application..."
pm2 restart tonebal --update-env

echo ""
echo "=== Deploy complete ==="
echo "Email auth should now be available at /login"
