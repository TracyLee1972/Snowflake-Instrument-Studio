#!/bin/bash

# Build script for macOS

set -e

echo "🎵 Building Snowflake Instrument Studio for macOS..."

# Create build directory
mkdir -p build-mac
cd build-mac

# Configure CMake for macOS
cmake -G "Xcode" -DCMAKE_OSX_ARCHITECTURES="arm64;x86_64" \
    -DBUILD_VST3=ON -DBUILD_STANDALONE=ON ..

# Build both VST3 and Standalone
cmake --build . --config Release --parallel

echo "✅ Build complete!"
echo "📦 VST3 plugin: build-mac/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3/"
echo "🎹 Standalone app: build-mac/SnowflakeInstrumentStudio-Standalone_artefacts/Release/"
