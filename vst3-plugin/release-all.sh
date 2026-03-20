#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Snowflake Unified Release Pipeline"
echo "=========================================="

action=""
case "$(uname -s)" in
  Darwin)
    action="macOS"
    "$SCRIPT_DIR/release-mac.sh"
    ;;
  Linux)
    action="Linux"
    chmod +x "$SCRIPT_DIR/package.sh"
    "$SCRIPT_DIR/package.sh"
    ;;
  *)
    echo "ERROR: Unsupported OS in this script."
    echo "Use release-win.bat on Windows."
    exit 1
    ;;
esac

echo ""
echo "✅ Completed release flow for: $action"
echo "📁 Output files:"
find "$SCRIPT_DIR/dist" -maxdepth 1 -type f \( -name '*.zip' -o -name '*.sha256' \) -print | sort
