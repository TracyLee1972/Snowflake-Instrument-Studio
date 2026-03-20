#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Snowflake macOS Release Pipeline"
echo "=========================================="

echo "[1/2] Building macOS binaries..."
"$SCRIPT_DIR/build-mac.sh"

echo "[2/2] Packaging macOS ZIP..."
"$SCRIPT_DIR/package-mac.sh"

echo ""
echo "SUCCESS: macOS release complete."
