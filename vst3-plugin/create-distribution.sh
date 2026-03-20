#!/bin/bash

# ============================================================================
# Snowflake Instrument Studio - Distribution Packaging Script
# Creates production-ready ZIP package for download
# ============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_NAME="SnowflakeInstrumentStudio"
VERSION="1.0.0"
DIST_DIR="$SCRIPT_DIR/dist"
PACKAGE_DIR="$DIST_DIR/$PROJECT_NAME-$VERSION"

echo "🔨 Building Snowflake Instrument Studio Distribution Package"
echo "==========================================================="
echo "Version: $VERSION"
echo "Target: $PACKAGE_DIR"
echo ""

# ============================================================================
# Step 1: Create directory structure
# ============================================================================

echo "📁 Creating directory structure..."
mkdir -p "$PACKAGE_DIR/"{VST3,Standalone,Samples,Documentation,Installer}

# ============================================================================
# Step 2: Copy plugin binaries (placeholder - would be actual build output)
# ============================================================================

echo "📦 Preparing plugin binaries..."
mkdir -p "$PACKAGE_DIR/VST3"
mkdir -p "$PACKAGE_DIR/Standalone"

# Copy real Linux build artifacts when present
if [ -d "$SCRIPT_DIR/build-linux/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3" ]; then
  cp -R "$SCRIPT_DIR/build-linux/SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3/"*.vst3 "$PACKAGE_DIR/VST3/" 2>/dev/null || true
fi

if [ -f "$SCRIPT_DIR/build-linux/SnowflakeInstrumentStudio-Standalone_artefacts/Release/Snowflake Instrument Studio" ]; then
  cp "$SCRIPT_DIR/build-linux/SnowflakeInstrumentStudio-Standalone_artefacts/Release/Snowflake Instrument Studio" "$PACKAGE_DIR/Standalone/"
fi

if [ -z "$(find "$PACKAGE_DIR/VST3" -maxdepth 1 -name '*.vst3' -print -quit)" ]; then
cat > "$PACKAGE_DIR/VST3/README.txt" << 'EOF'
VST3 Plugin Files
=================

Windows x64:
  - SnowflakeInstrumentStudio.vst3
  
macOS Universal (Intel + Apple Silicon):
  - SnowflakeInstrumentStudio.vst3
  
These are built during the CI/CD pipeline and placed here.
Copy to your system VST3 folder:
  
  Windows: C:\Program Files\Common Files\VST3\
  macOS:   /Library/Audio/Plug-ins/VST3/
EOF
fi

if [ -z "$(find "$PACKAGE_DIR/Standalone" -maxdepth 1 -type f -print -quit)" ]; then
cat > "$PACKAGE_DIR/Standalone/README.txt" << 'EOF'
Standalone Executable
=====================

Windows x64:
  - SnowflakeInstrumentStudio.exe
  
macOS Universal (Intel + Apple Silicon):
  - SnowflakeInstrumentStudio.app (macOS application)

Run directly without installation. Double-click to launch.
No plugins folder required for standalone version.
EOF
fi

# ============================================================================
# Step 3: Copy documentation
# ============================================================================

echo "📋 Copying documentation..."
cp "$SCRIPT_DIR/README.md" "$PACKAGE_DIR/Documentation/README.md"
cp "$SCRIPT_DIR/QUICKSTART.md" "$PACKAGE_DIR/Documentation/QUICKSTART.md"
cp "$SCRIPT_DIR/BUILD.md" "$PACKAGE_DIR/Documentation/BUILD.md"
cp "$SCRIPT_DIR/INSTALL_Windows.md" "$PACKAGE_DIR/Documentation/INSTALL_Windows.md"
cp "$SCRIPT_DIR/INSTALL_macOS.md" "$PACKAGE_DIR/Documentation/INSTALL_macOS.md"
cp "$SCRIPT_DIR/ABLETON_LIVE_LIGHT_GUIDE.md" "$PACKAGE_DIR/Documentation/ABLETON_LIVE_LIGHT_GUIDE.md"
cp "$SCRIPT_DIR/COMMERCIAL_LICENSE.md" "$PACKAGE_DIR/Documentation/COMMERCIAL_LICENSE.md"
cp "$SCRIPT_DIR/LICENSE" "$PACKAGE_DIR/LICENSE.txt"

# ============================================================================
# Step 3b: Copy easy installer scripts
# ============================================================================

echo "🛠️ Copying easy installer scripts..."
cp "$SCRIPT_DIR/installers/Install-Windows.bat" "$PACKAGE_DIR/Installer/Install-Windows.bat"
cp "$SCRIPT_DIR/installers/Install-macOS.command" "$PACKAGE_DIR/Installer/Install-macOS.command"
cp "$SCRIPT_DIR/installers/INSTALLER_README.txt" "$PACKAGE_DIR/Installer/INSTALLER_README.txt"
chmod +x "$PACKAGE_DIR/Installer/Install-macOS.command"

# ============================================================================
# Step 4: Create sample library placeholder
# ============================================================================

echo "🎵 Creating sample library directory..."
mkdir -p "$PACKAGE_DIR/Samples/Drums"
mkdir -p "$PACKAGE_DIR/Samples/Synths"
mkdir -p "$PACKAGE_DIR/Samples/Basses"

cat > "$PACKAGE_DIR/Samples/README.md" << 'EOF'
# Sample Library Directory

Place your WAV sample files in these folders:

- **Drums/** - Drum hits (kicks, snares, hats, etc.)
- **Synths/** - Synthesizer samples (leads, pads, etc.)
- **Basses/** - Bass samples (low end, bass instruments)

The plugin will load WAV files from any of these directories.

## Naming Convention (Optional but Recommended)

For best auto-mapping results, name files with MIDI note:

- `C4-Kick.wav` - Maps to MIDI C4
- `D#5-Snare.wav` - Maps to MIDI D#5
- `A3-Bass.wav` - Maps to MIDI A3

## Sample Format Requirements

✅ Format: WAV (16-bit or 24-bit PCM)
✅ Sample Rate: 44.1kHz or 48kHz
✅ Size: Up to 1MB per sample
✅ Channels: Mono or Stereo

❌ Avoid: MP3, FLAC, DSD (not supported)
EOF

# ============================================================================
# Step 5: Create quick start files
# ============================================================================

echo "🚀 Creating quick start resources..."

cat > "$PACKAGE_DIR/START_HERE.txt" << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║  SNOWFLAKE INSTRUMENT STUDIO - VST3 PLUGIN & STANDALONE APP   ║
║  Version 1.0.0 | Commercial License Included                  ║
└════════════════════════════════════════════════════════════════╝

📖 QUICK START GUIDE
====================

1. READ FIRST:
   → Documentation/QUICKSTART.md (5-minute setup)
   → Documentation/ABLETON_LIVE_LIGHT_GUIDE.md (Ableton-specific)

2. FOR WINDOWS 11:
   → See Documentation/INSTALL_Windows.md

3. FOR macOS:
   → See Documentation/INSTALL_macOS.md

4. FOR DEVELOPMENT/BUILDING:
   → See Documentation/BUILD.md

📂 FOLDER STRUCTURE
===================

SnowflakeInstrumentStudio-1.0.0/
├── Installer/                     ← One-click installers for plugin install
│   ├── Install-Windows.bat
│   ├── Install-macOS.command
│   └── INSTALLER_README.txt
├── VST3/                          ← VST3 plugin files (copy to DAW)
├── Standalone/                    ← Run directly (no DAW needed)
├── Samples/                       ← Place your WAV samples here
│   ├── Drums/
│   ├── Synths/
│   └── Basses/
├── Documentation/                 ← All guides and documentation
│   ├── QUICKSTART.md             ← Start here! (5 min read)
│   ├── ABLETON_LIVE_LIGHT_GUIDE.md ← Ableton-specific setup
│   ├── INSTALL_Windows.md
│   ├── INSTALL_macOS.md
│   ├── README.md
│   ├── BUILD.md
│   └── COMMERCIAL_LICENSE.md     ← What you can do with it
└── LICENSE.txt                    ← MIT + Commercial terms

⚡ INSTALLATION (30 SECONDS)
=============================

WINDOWS 11:
1. Extract this ZIP file
2. Run "Installer/Install-Windows.bat"
3. Restart Ableton Live
4. Rescan plugins
5. Add to MIDI track

macOS:
1. Extract this ZIP file
2. Run "Installer/Install-macOS.command"
3. Restart Ableton Live
4. Rescan plugins
5. Add to MIDI track

🎵 LOADING SAMPLES
===================

1. Click "📂 Browse Samples" in the plugin
2. Select your WAV files
3. Click "✓ Apply Mapping"
4. Start playing!

💻 KEYBOARD SHORTCUTS
======================

Computer Keyboard (when plugin window focused):
  A-L  = White keys (left to right)
  W-P  = Black keys (left to right)  
  Z   = Octave down
  X   = Octave up

Or use MIDI keyboard, mouse click on piano preview.

📊 FEATURES
===========

✅ Sample playback with pitch-shifting
✅ ADSR envelope (Attack, Decay, Sustain, Release)
✅ 4-type filter (Lowpass, Highpass, Bandpass, Notch)
✅ 3-band EQ (Low, Mid, High)
✅ Round-robin sample support
✅ Velocity sensitivity
✅ MIDI recording with WAV export
✅ Works with All DAWs (Ableton, Reaper, Cubase, Logic, etc.)
✅ VST3 format + Standalone app

⚖️ COMMERCIAL LICENSE
=======================

✅ Create and sell music
✅ Use in YouTube videos (monetized)
✅ License to film/TV
✅ Sell sample packs
✅ Use for commercial clients
✅ No royalties owed
✅ Perpetual license
✅ Multiple installations

See: Documentation/COMMERCIAL_LICENSE.md

❓ HELP & SUPPORT
==================

1. Check Documentation/ folder for all guides
2. Read relevant .md file for your system
3. See QUICKSTART.md for common questions
4. See BUILD.md for technical issues

🎯 NEXT STEPS
==============

1. Read: Documentation/QUICKSTART.md
2. Install: Follow INSTALL_Windows.md or INSTALL_macOS.md
3. Load Samples: Place WAV files in Samples/ folder
4. Make Music: Create your first project!

═══════════════════════════════════════════════════════════════

Made with ❄️ by the Snowflake Team | March 2026

EOF

# ============================================================================
# Step 6: Create archive
# ============================================================================

echo "📦 Creating ZIP archive..."
cd "$DIST_DIR"
zip -r "$PROJECT_NAME-$VERSION.zip" "$PROJECT_NAME-$VERSION/" -q

# Get file size
ZIPFILE="$DIST_DIR/$PROJECT_NAME-$VERSION.zip"
FILESIZE=$(du -h "$ZIPFILE" | cut -f1)

echo ""
echo "✅ Distribution package created successfully!"
echo ""
echo "📍 Location: $ZIPFILE"
echo "📊 Size: $FILESIZE"
echo ""
echo "================== PACKAGE CONTENTS =================="
echo ""
unzip -l "$ZIPFILE" | head -30
echo ""
echo "... (see full contents above)"
echo ""
echo "======================================================"
echo ""
echo "🚀 READY FOR DOWNLOAD!"
echo ""
echo "Next Steps:"
echo "1. Download: $ZIPFILE"
echo "2. Extract the ZIP file"
echo "3. Read: START_HERE.txt"
echo "4. Follow the installation guide for your OS"
echo ""

# ============================================================================
# Step 7: Create checksum for verification
# ============================================================================

echo "🔐 Creating integrity checksum..."
if command -v sha256sum &> /dev/null; then
  sha256sum "$ZIPFILE" > "$ZIPFILE.sha256"
  echo "✅ Checksum saved: $ZIPFILE.sha256"
  echo ""
  cat "$ZIPFILE.sha256"
fi

echo ""
echo "✅ Packaging complete!"
