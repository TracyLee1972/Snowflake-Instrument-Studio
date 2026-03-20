#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="1.0.0"
PRODUCT_NAME="SnowflakeInstrumentStudio"
OUTPUT_DIR="$SCRIPT_DIR/dist"

echo "📦 Creating platform ZIP packages..."
mkdir -p "$OUTPUT_DIR"

copy_common_files() {
    local pkg_root="$1"
    mkdir -p "$pkg_root/Documentation" "$pkg_root/Installer" "$pkg_root/Samples/Drums" "$pkg_root/Samples/Synths" "$pkg_root/Samples/Basses"

    cp "$SCRIPT_DIR/README.md" "$pkg_root/Documentation/README.md"
    cp "$SCRIPT_DIR/QUICKSTART.md" "$pkg_root/Documentation/QUICKSTART.md"
    cp "$SCRIPT_DIR/BUILD.md" "$pkg_root/Documentation/BUILD.md"
    cp "$SCRIPT_DIR/ABLETON_LIVE_LIGHT_GUIDE.md" "$pkg_root/Documentation/ABLETON_LIVE_LIGHT_GUIDE.md"
    cp "$SCRIPT_DIR/COMMERCIAL_LICENSE.md" "$pkg_root/Documentation/COMMERCIAL_LICENSE.md"
    cp "$SCRIPT_DIR/LICENSE" "$pkg_root/LICENSE.txt"

    cp "$SCRIPT_DIR/installers/Install-Windows.bat" "$pkg_root/Installer/Install-Windows.bat"
    cp "$SCRIPT_DIR/installers/Install-macOS.command" "$pkg_root/Installer/Install-macOS.command"
    cp "$SCRIPT_DIR/installers/INSTALLER_README.txt" "$pkg_root/Installer/INSTALLER_README.txt"
    chmod +x "$pkg_root/Installer/Install-macOS.command"

    cat > "$pkg_root/Samples/README.md" << 'EOF'
# Samples

Put your WAV files into Drums, Synths, or Basses folders.
The plugin accepts WAV files and can auto-map them.
EOF
}

package_platform() {
    local platform="$1"
    local vst3_source="$2"
    local standalone_source="$3"
    local install_doc="$4"

    local root_dir="$OUTPUT_DIR/${PRODUCT_NAME}-${VERSION}-${platform}"
    local zip_file="$OUTPUT_DIR/${PRODUCT_NAME}-${VERSION}-${platform}.zip"

    rm -rf "$root_dir"
    mkdir -p "$root_dir/VST3" "$root_dir/Standalone"
    copy_common_files "$root_dir"
    cp "$SCRIPT_DIR/$install_doc" "$root_dir/Documentation/$install_doc"

    # Copy VST3 bundle(s)
    if [ -d "$SCRIPT_DIR/$vst3_source" ]; then
        cp -R "$SCRIPT_DIR/$vst3_source"/*.vst3 "$root_dir/VST3/" 2>/dev/null || true
    fi

    # Copy standalone executable/app
    if [ -e "$SCRIPT_DIR/$standalone_source" ]; then
        cp -R "$SCRIPT_DIR/$standalone_source" "$root_dir/Standalone/"
    fi

    # Guard: only package if at least one binary artifact exists
    if [ -z "$(find "$root_dir/VST3" -maxdepth 1 -name '*.vst3' -print -quit)" ] && \
       [ -z "$(find "$root_dir/Standalone" -maxdepth 1 -type f -print -quit)" ] && \
       [ -z "$(find "$root_dir/Standalone" -maxdepth 1 -name '*.app' -print -quit)" ]; then
        echo "⚠️  Skipping $platform package (no native artifacts found)."
        rm -rf "$root_dir"
        return 0
    fi

    (cd "$OUTPUT_DIR" && zip -rq "$zip_file" "$(basename "$root_dir")")

    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$zip_file" > "$zip_file.sha256"
    fi

    echo "✅ Created: $zip_file"
}

# Windows
package_platform \
    "Windows" \
    "build-win/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3" \
    "build-win/SnowflakeInstrumentStudio-Standalone_artefacts/Release/Snowflake Instrument Studio.exe" \
    "INSTALL_Windows.md"

# macOS
package_platform \
    "macOS" \
    "build-mac/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3" \
    "build-mac/SnowflakeInstrumentStudio-Standalone_artefacts/Release/Snowflake Instrument Studio.app" \
    "INSTALL_macOS.md"

# Linux
package_platform \
    "Linux" \
    "build-linux/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3" \
    "build-linux/SnowflakeInstrumentStudio-Standalone_artefacts/Release/Snowflake Instrument Studio" \
    "BUILD.md"

echo ""
echo "📁 Done. Check: $OUTPUT_DIR"
