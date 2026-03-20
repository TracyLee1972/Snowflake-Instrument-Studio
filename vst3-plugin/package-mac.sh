#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="1.0.0"
PRODUCT_NAME="SnowflakeInstrumentStudio"
DIST_DIR="$SCRIPT_DIR/dist"
PKG_NAME="${PRODUCT_NAME}-${VERSION}-macOS"
PKG_DIR="$DIST_DIR/$PKG_NAME"
ZIP_PATH="$DIST_DIR/${PKG_NAME}.zip"

VST3_SRC="$SCRIPT_DIR/build-mac/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3"
APP_SRC="$SCRIPT_DIR/build-mac/SnowflakeInstrumentStudio-Standalone_artefacts/Release/Snowflake Instrument Studio.app"

echo "=========================================="
echo "Packaging macOS Release"
echo "=========================================="

if [[ ! -d "$VST3_SRC" ]]; then
  echo "ERROR: Missing VST3 artifacts: $VST3_SRC"
  echo "Run ./build-mac.sh first."
  exit 1
fi

mkdir -p "$DIST_DIR"
rm -rf "$PKG_DIR"
rm -f "$ZIP_PATH" "$ZIP_PATH.sha256"

mkdir -p "$PKG_DIR/VST3" "$PKG_DIR/Standalone" "$PKG_DIR/Documentation" "$PKG_DIR/Installer" "$PKG_DIR/Samples/Drums" "$PKG_DIR/Samples/Synths" "$PKG_DIR/Samples/Basses"

cp -R "$VST3_SRC"/*.vst3 "$PKG_DIR/VST3/" 2>/dev/null || true
if [[ -d "$APP_SRC" ]]; then
  cp -R "$APP_SRC" "$PKG_DIR/Standalone/"
fi

cp "$SCRIPT_DIR/README.md" "$PKG_DIR/Documentation/README.md"
cp "$SCRIPT_DIR/QUICKSTART.md" "$PKG_DIR/Documentation/QUICKSTART.md"
cp "$SCRIPT_DIR/BUILD.md" "$PKG_DIR/Documentation/BUILD.md"
cp "$SCRIPT_DIR/INSTALL_macOS.md" "$PKG_DIR/Documentation/INSTALL_macOS.md"
cp "$SCRIPT_DIR/ABLETON_LIVE_LIGHT_GUIDE.md" "$PKG_DIR/Documentation/ABLETON_LIVE_LIGHT_GUIDE.md"
cp "$SCRIPT_DIR/COMMERCIAL_LICENSE.md" "$PKG_DIR/Documentation/COMMERCIAL_LICENSE.md"
cp "$SCRIPT_DIR/LICENSE" "$PKG_DIR/LICENSE.txt"

cp "$SCRIPT_DIR/installers/Install-macOS.command" "$PKG_DIR/Installer/Install-macOS.command"
cp "$SCRIPT_DIR/installers/Install-Windows.bat" "$PKG_DIR/Installer/Install-Windows.bat"
cp "$SCRIPT_DIR/installers/INSTALLER_README.txt" "$PKG_DIR/Installer/INSTALLER_README.txt"
chmod +x "$PKG_DIR/Installer/Install-macOS.command"

cat > "$PKG_DIR/Samples/README.md" << 'EOF'
# Samples

Put your WAV files into Drums, Synths, or Basses folders.
The plugin accepts WAV files and can auto-map them.
EOF

if [[ -z "$(find "$PKG_DIR/VST3" -maxdepth 1 -name '*.vst3' -print -quit)" ]]; then
  echo "ERROR: No .vst3 bundle found to package."
  exit 1
fi

(
  cd "$DIST_DIR"
  zip -rq "$ZIP_PATH" "$PKG_NAME"
)

if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$ZIP_PATH" > "$ZIP_PATH.sha256"
elif command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$ZIP_PATH" > "$ZIP_PATH.sha256"
fi

echo "SUCCESS: Created macOS package:"
echo "$ZIP_PATH"
if [[ -f "$ZIP_PATH.sha256" ]]; then
  echo "Checksum: $ZIP_PATH.sha256"
fi
