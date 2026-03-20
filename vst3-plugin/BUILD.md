# Building Snowflake Instrument Studio VST3

Complete instructions for building the VST3 plugin and standalone application.

---

## 🖥️ System Requirements

### **Windows 11**

- **Visual Studio 2022** (Community Edition is fine)
  - Install "Desktop development with C++" workload
  - Windows 11 SDK
- **CMake 3.21+** ([download](https://cmake.org/download/))
- **Git** ([download](https://git-scm.com/))

### **macOS (Intel or Apple Silicon)**

- **Xcode 13+** ([App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **CMake 3.21+** (`brew install cmake`)
- **Git** (included with Xcode or `brew install git`)

---

## 📥 Setup: Clone Repository

```bash
# Clone the repository
git clone https://github.com/TracyLee1972/Snowflake-Instrument-Studio.git
cd Snowflake-Instrument-Studio/vst3-plugin

# JUCE will be cloned automatically during build
```

---

## 🏗️ Building on Windows

### **Option 1: Automated Build** (Recommended)

```bash
# Double-click build-win.bat
# OR from PowerShell:
.\build-win.bat
```

This will:
1. Create `build-win/` directory
2. Download & configure JUCE
3. Generate Visual Studio project
4. Compile VST3 and Standalone
5. Report output locations

### **Option 2: Manual Build**

```bash
# Create and enter build directory
mkdir build-win
cd build-win

# Configure with CMake
cmake -G "Visual Studio 17 2022" -A x64 ^
  -DBUILD_VST3=ON ^
  -DBUILD_STANDALONE=ON ..

# Build Release configuration
cmake --build . --config Release --parallel

# Find outputs:
# VST3:       SnowflakeInstrumentStudio-VST3_artefacts\Release\VST3\
# Standalone: SnowflakeInstrumentStudio-Standalone_artefacts\Release\
```

### **Troubleshooting Windows Build**

**"cmake not found"**
- Add CMake to PATH: `C:\Program Files\CMake\bin`
- Restart terminal/PowerShell

**"Visual Studio not found"**
- Verify VS 2022 installed with C++ workload
- Check: `C:\Program Files\Microsoft Visual Studio\2022\Community\`

**Build hangs on JUCE download**
- JUCE is ~2GB; download may take time on slow internet
- Check internet speed or try later

---

## 🍎 Building on macOS

### **Option 1: Automated Build** (Recommended)

```bash
# Make script executable
chmod +x build-mac.sh

# Run build
./build-mac.sh
```

This will:
1. Create `build-mac/` directory
2. Download & configure JUCE (Universal binary: arm64 + x86_64)
3. Generate Xcode project
4. Compile VST3 and Standalone
5. Report output locations

### **Option 2: Manual Build**

```bash
# Create build directory
mkdir build-mac && cd build-mac

# Configure for both arm64 (Apple Silicon) and x86_64 (Intel)
cmake -G "Xcode" \
  -DCMAKE_OSX_ARCHITECTURES="arm64;x86_64" \
  -DBUILD_VST3=ON \
  -DBUILD_STANDALONE=ON ..

# Build Release
cmake --build . --config Release --parallel

# Find outputs:
# VST3:       SnowflakeInstrumentStudio-VST3_artefacts/Release/VST3/
# Standalone: SnowflakeInstrumentStudio-Standalone_artefacts/Release/
```

### **Troubleshooting macOS Build**

**"cmake: command not found"**
```bash
brew install cmake
```

**"Xcode not installed"**
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

**"Too many open files" error**
```bash
# Increase file descriptor limit
ulimit -n 4096
```

---

## 📦 Packaging for Distribution

### **Create Installable ZIP Files**

```bash
# Make packaging script executable
chmod +x package.sh

# Create distribution packages
./package.sh
```

This generates:
- `dist/SnowflakeInstrumentStudio-1.0.0-Windows.zip`
- `dist/SnowflakeInstrumentStudio-1.0.0-macOS.zip`

Each ZIP contains:
```
SnowflakeInstrumentStudio-1.0.0-[OS]/
├── VST3/
│   └── SnowflakeInstrumentStudio.vst3
├── Standalone/
│   └── SnowflakeInstrumentStudio[.exe|.app]
├── Documentation/
│   ├── README.md
│   └── INSTALL_[OS].md
└── LICENSE
```

---

## 🧪 Testing the Build

### **Test VST3 Plugin**

1. **Copy plugin to system location:**
   - Windows: `C:\Program Files\Common Files\VST3\`
   - macOS: `~/Library/Audio/Plug-Ins/VST3/`

2. **Test in DAW:**
   ```
   - Ableton Live 12
   - Reaper
   - Cubase
   - Any VST3 host
   ```

3. **Verify:**
   - ✅ Plugin appears in instrument list
   - ✅ MIDI input works
   - ✅ Audio outputs
   - ✅ Parameters update
   - ✅ Preset save/load works

### **Test Standalone Application**

1. **Launch executable:**
   - Windows: `SnowflakeInstrumentStudio.exe`
   - macOS: `SnowflakeInstrumentStudio.app`

2. **Verify:**
   - ✅ Window opens with UI
   - ✅ MIDI keyboard/mouse playback
   - ✅ Knobs/sliders respond
   - ✅ Load samples works
   - ✅ Audio output plays

---

## 🔨 Custom Build Options

### **VST3 Only (No Standalone)**

```bash
mkdir build && cd build
cmake -DBUILD_VST3=ON -DBUILD_STANDALONE=OFF ..
cmake --build . --config Release
```

### **Standalone Only (No VST3)**

```bash
mkdir build && cd build
cmake -DBUILD_VST3=OFF -DBUILD_STANDALONE=ON ..
cmake --build . --config Release
```

### **Debug Build** (for development)

```bash
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Debug ..
cmake --build . --config Debug
```

---

## 📊 Build Output Locations

After successful build, find outputs at:

### **Windows**
```
build-win/
├── SnowflakeInstrumentStudio-VST3_artefacts/Release/
│   └── VST3/SnowflakeInstrumentStudio/
│       └── SnowflakeInstrumentStudio.vst3
└── SnowflakeInstrumentStudio-Standalone_artefacts/Release/
    └── SnowflakeInstrumentStudio.exe
```

### **macOS**
```
build-mac/
├── SnowflakeInstrumentStudio-VST3_artefacts/Release/
│   └── VST3/SnowflakeInstrumentStudio.vst3
└── SnowflakeInstrumentStudio-Standalone_artefacts/Release/
    └── SnowflakeInstrumentStudio.app
```

---

## 🚀 CI/CD & Automated Builds

### **GitHub Actions** (Optional Setup)

Create `.github/workflows/build.yml` for automated builds on every push:

```yaml
name: Build VST3 & Standalone

on: [push, pull_request]

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup CMake
        uses: cmake-ci/cmake-action@v1.0.0
      - name: Build
        run: cd vst3-plugin && .\build-win.bat

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup CMake
        run: brew install cmake
      - name: Build
        run: cd vst3-plugin && chmod +x build-mac.sh && ./build-mac.sh
```

---

## 💾 Installing Plugins in DAWs

### **Ableton Live 12**

1. Copy `.vst3` to: `C:\Program Files\Common Files\VST3\` (Windows)
2. Or: `~/Library/Audio/Plug-Ins/VST3/` (macOS)
3. Restart Ableton
4. Preferences → Library → Rescan

### **Reaper**

1. Extensions → Show REAPER resource path
2. Place `.vst3` in `Plugins/VST3/`
3. Close/reopen Reaper

### **Cubase**

1. Plugins → Rescan
2. Or manually: `C:\Program Files\Steinberg\Cubase\Components\VST3\`

### **Logic Pro** (macOS)

Requires AU plugin (future release). VST3 requires third-party wrapper.

---

## 🐛 Debugging Build Issues

### **Enable Verbose Build Output**

```bash
cmake --build . --config Release --verbose
```

### **Check CMake Version**

```bash
cmake --version
# Should be 3.21 or higher
```

### **Clear Build Cache**

```bash
rm -rf build/  # macOS/Linux
rmdir /s build  # Windows (PowerShell: rm -r build)
```

### **Test JUCE Installation**

```bash
# Verify JUCE was downloaded
ls JUCE/  # or: dir JUCE
```

---

## 📝 Source Code Structure

```
vst3-plugin/source/
├── PluginProcessor.h/cpp      # VST3 audio processor
├── PluginEditor.h/cpp         # UI/Editor
├── AudioEngine.h/cpp          # Core synth/sample playback
├── ADSREnvelope.h/cpp         # ADSR implementation
├── FilterProcessor.h/cpp      # Biquad filter (4 types)
├── EQProcessor.h/cpp          # 3-band EQ
├── SampleManager.h/cpp        # Sample loading/mapping
└── StandaloneApp.h/cpp        # Standalone app entry
```

---

## 📚 Additional Resources

- **JUCE Documentation:** https://docs.juce.com/
- **VST3 Spec:** https://steinbergmedia.github.io/vst3/
- **CMake Guide:** https://cmake.org/cmake/help/latest/

---

## ✅ Verification Checklist

After building, verify:

- [ ] Build completes without errors
- [ ] VST3 `.vst3` file exists and is non-zero size
- [ ] Standalone executable/app exists
- [ ] Plugin loads in DAW
- [ ] Audio processes without crackling
- [ ] Presets save/load correctly
- [ ] Samples load and play
- [ ] MIDI input recognized
- [ ] All knobs/sliders respond
- [ ] No memory leaks (run under valgrind/Instruments)

---

**Happy Building! 🎶**
