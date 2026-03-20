#!/bin/bash

# Packaging script to create distributable ZIP files

set -e

VERSION="1.0.0"
OUTPUT_DIR="dist"

echo "📦 Creating Snowflake Instrument Studio distribution packages..."

mkdir -p "$OUTPUT_DIR"

# ============================================================================
# macOS Package
# ============================================================================
if [ -d "build-mac/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3" ]; then
    echo "📦 Packaging macOS VST3..."
    
    MACOS_PKG="$OUTPUT_DIR/SnowflakeInstrumentStudio-${VERSION}-macOS.zip"
    
    # Create temporary package directory
    TEMP_PKG=$(mktemp -d)
    trap "rm -rf $TEMP_PKG" EXIT
    
    mkdir -p "$TEMP_PKG/VST3"
    mkdir -p "$TEMP_PKG/Standalone"
    mkdir -p "$TEMP_PKG/Documentation"
    
    # Copy VST3 plugin (install to ~/Library/Audio/Plug-Ins/VST3/)
    cp -r build-mac/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3/*.vst3 "$TEMP_PKG/VST3/" || true
    
    # Copy Standalone app
    cp -r build-mac/SnowflakeInstrumentStudio-Standalone_artefacts/Release/*.app "$TEMP_PKG/Standalone/" || true
    
    # Copy documentation and license
    cp README.md "$TEMP_PKG/Documentation/" || true
    cp INSTALL_macOS.md "$TEMP_PKG/Documentation/" || true
    cp LICENSE "$TEMP_PKG/" || true
    
    # Create ZIP
    cd "$TEMP_PKG"
    zip -r "$MACOS_PKG" .
    cd -
    
    echo "✅ Created: $MACOS_PKG"
fi

# ============================================================================
# Windows Package
# ============================================================================
if [ -d "build-win/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3" ]; then
    echo "📦 Packaging Windows VST3..."
    
    WINDOWS_PKG="$OUTPUT_DIR/SnowflakeInstrumentStudio-${VERSION}-Windows.zip"
    
    # Create temporary package directory
    TEMP_PKG=$(mktemp -d)
    trap "rm -rf $TEMP_PKG" EXIT
    
    mkdir -p "$TEMP_PKG/VST3"
    mkdir -p "$TEMP_PKG/Standalone"
    mkdir -p "$TEMP_PKG/Documentation"
    
    # Copy VST3 plugin (install to %APPDATA%\Programs\Common\VST3\)
    cp -r build-win/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3/*.vst3 "$TEMP_PKG/VST3/" || true
    
    # Copy Standalone app
    cp -r build-win/SnowflakeInstrumentStudio-Standalone_artefacts/Release/*.exe "$TEMP_PKG/Standalone/" || true
    
    # Copy documentation and license
    cp README.md "$TEMP_PKG/Documentation/" || true
    cp INSTALL_Windows.md "$TEMP_PKG/Documentation/" || true
    cp LICENSE "$TEMP_PKG/" || true
    
    # Create ZIP
    cd "$TEMP_PKG"
    zip -r "$WINDOWS_PKG" .
    cd -
    
    echo "✅ Created: $WINDOWS_PKG"
fi

echo ""
echo "✅ All packages created successfully!"
echo "📁 Distribution files in: $OUTPUT_DIR/"
