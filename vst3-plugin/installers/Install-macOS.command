#!/bin/bash
set -e

echo "============================================"
echo "Snowflake Instrument Studio VST3 Installer"
echo "============================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PACKAGE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLUGIN_DIR="$PACKAGE_ROOT/VST3"
TARGET_DIR="/Library/Audio/Plug-Ins/VST3"

if [ ! -d "$PLUGIN_DIR" ]; then
  echo "ERROR: Could not find VST3 folder at: $PLUGIN_DIR"
  echo "Make sure this installer is inside the extracted ZIP package."
  exit 1
fi

PLUGIN_PATH=""
for p in "$PLUGIN_DIR"/*.vst3; do
  if [ -d "$p" ]; then
    PLUGIN_PATH="$p"
    break
  fi
done

if [ -z "$PLUGIN_PATH" ]; then
  echo "ERROR: No .vst3 plugin found in $PLUGIN_DIR"
  echo "Place SnowflakeInstrumentStudio.vst3 in the VST3 folder and run again."
  exit 1
fi

echo "Installing plugin to: $TARGET_DIR"
echo "You may be prompted for your password."
echo ""

sudo mkdir -p "$TARGET_DIR"
PLUGIN_NAME="$(basename "$PLUGIN_PATH")"
sudo rm -rf "$TARGET_DIR/$PLUGIN_NAME"
sudo cp -R "$PLUGIN_PATH" "$TARGET_DIR/$PLUGIN_NAME"

echo ""
echo "SUCCESS: Plugin installed."
echo ""
echo "Next steps:"
echo "1. Open Ableton Live Light"
echo "2. Go to Preferences > Plug-ins"
echo "3. Click Rescan"
echo "4. Add Snowflake Instrument Studio to a MIDI track"
